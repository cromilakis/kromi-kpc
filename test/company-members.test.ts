import { afterEach, describe, expect, it, vi } from "vitest";

// `createClient` (Supabase server, cliente de sesión del consultor) y
// `createAdminClient` (Supabase service-role, exclusivo para
// auth.admin.inviteUserByEmail) mockeados: estos tests no deben pegarle a
// una instancia real de Supabase. Mismo patrón que
// test/interview/extract-action.test.ts.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteCompanyMember } from "@/lib/actions/company-members";

// z.uuid() valida el nibble de variante RFC4122 (8/9/a/b en el 3er grupo).
const CONSULTANT_ID = "11111111-1111-4111-a111-111111111111";
const COMPANY_ID = "33333333-3333-4333-a333-333333333333";
const INVITED_USER_ID = "44444444-4444-4444-a444-444444444444";
const EMAIL = "cliente@empresa.cl";

type QueryResult = { data: unknown; error: unknown };

/** Builder encadenable mínimo: métodos intermedios devuelven `this`, los
 * terminales (`maybeSingle`, `then`) resuelven `result`. */
function chain(result: QueryResult) {
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: () => obj,
    insert: () => obj,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (r: QueryResult) => unknown) => resolve(result),
  };
  return obj;
}

type FakeSupabaseOpts = {
  profile?: QueryResult;
  company?: QueryResult;
  memberInsert?: QueryResult;
  auditInsert?: QueryResult;
  user?: { id: string } | null;
};

function fakeSupabase(opts: FakeSupabaseOpts = {}) {
  const {
    profile = { data: { role: "consultant" }, error: null },
    company = { data: { id: COMPANY_ID }, error: null },
    memberInsert = { data: null, error: null },
    auditInsert = { data: null, error: null },
    user = { id: CONSULTANT_ID },
  } = opts;

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") return chain(profile);
      if (table === "companies") return chain(company);
      if (table === "company_members") return chain(memberInsert);
      if (table === "audit_log") return chain(auditInsert);
      throw new Error(`tabla no mockeada en el test: ${table}`);
    }),
  };

  return supabase;
}

function fakeAdmin(opts: {
  inviteData?: { user: { id: string } | null };
  inviteError?: { code?: string; message?: string } | null;
  listUsers?: { users: { id: string; email?: string }[] };
} = {}) {
  const {
    inviteData = { user: { id: INVITED_USER_ID } },
    inviteError = null,
    listUsers = { users: [] },
  } = opts;

  return {
    auth: {
      admin: {
        inviteUserByEmail: vi.fn().mockResolvedValue({
          data: inviteData,
          error: inviteError,
        }),
        listUsers: vi.fn().mockResolvedValue({ data: listUsers, error: null }),
      },
    },
  };
}

describe("inviteCompanyMember", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("valida la entrada (companyId no-uuid o email inválido)", async () => {
    const supabase = fakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const badCompany = await inviteCompanyMember("no-es-uuid", EMAIL);
    expect(badCompany).toEqual({ ok: false, error: "validation" });

    const badEmail = await inviteCompanyMember(COMPANY_ID, "no-es-correo");
    expect(badEmail).toEqual({ ok: false, error: "validation" });

    expect(createClient).not.toHaveBeenCalled();
  });

  it("sin sesión devuelve unauthorized", async () => {
    const supabase = fakeSupabase({ user: null });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);
    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("usuario sin profile de staff (no consultor/admin) devuelve unauthorized", async () => {
    const supabase = fakeSupabase({ profile: { data: null, error: null } });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);
    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("invita OK: crea el usuario de auth, inserta company_members y audita", async () => {
    const supabase = fakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const admin = fakeAdmin();
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);

    expect(result).toEqual({ ok: true });
    expect(admin.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(EMAIL);
    expect(supabase.from).toHaveBeenCalledWith("company_members");
    expect(supabase.from).toHaveBeenCalledWith("audit_log");
  });

  it("inserta company_members con los campos correctos (status invited)", async () => {
    const insertFieldsSeen: unknown[] = [];
    const supabase = fakeSupabase();
    supabase.from = vi.fn((table: string) => {
      if (table === "profiles") return chain({ data: { role: "consultant" }, error: null });
      if (table === "companies") return chain({ data: { id: COMPANY_ID }, error: null });
      if (table === "company_members") {
        return {
          insert: (fields: unknown) => {
            insertFieldsSeen.push(fields);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      if (table === "audit_log") return { insert: () => Promise.resolve({ data: null, error: null }) };
      throw new Error(`tabla no mockeada: ${table}`);
    }) as never;
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const admin = fakeAdmin();
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);

    expect(result).toEqual({ ok: true });
    expect(insertFieldsSeen).toEqual([
      {
        user_id: INVITED_USER_ID,
        company_id: COMPANY_ID,
        invited_by: CONSULTANT_ID,
        status: "invited",
      },
    ]);
  });

  it("email ya existente (email_exists) resuelve el user vía listUsers y sigue el flujo", async () => {
    const supabase = fakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const admin = fakeAdmin({
      inviteData: { user: null },
      inviteError: { code: "email_exists", message: "Email already registered" },
      listUsers: { users: [{ id: INVITED_USER_ID, email: EMAIL }] },
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);

    expect(result).toEqual({ ok: true });
    expect(admin.auth.admin.listUsers).toHaveBeenCalled();
  });

  it("violación de unique(user_id) en company_members devuelve already_member", async () => {
    const supabase = fakeSupabase({
      memberInsert: {
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const admin = fakeAdmin();
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);

    expect(result).toEqual({ ok: false, error: "already_member" });
  });

  it("error inesperado de inviteUserByEmail (no email_exists) devuelve unavailable", async () => {
    const supabase = fakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const admin = fakeAdmin({
      inviteData: { user: null },
      inviteError: { code: "unexpected_failure", message: "boom" },
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);

    expect(result).toEqual({ ok: false, error: "unavailable" });
  });

  it("empresa inexistente devuelve validation", async () => {
    const supabase = fakeSupabase({ company: { data: null, error: null } });
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const admin = fakeAdmin();
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const result = await inviteCompanyMember(COMPANY_ID, EMAIL);

    expect(result).toEqual({ ok: false, error: "validation" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
