import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// 简单的用户存储（MVP阶段用内存+localStorage，后续迁移到数据库）
// 密码用 base64 编码存储（非安全方案，仅MVP）
const users: Map<string, { email: string; password: string; name: string }> =
  new Map();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = users.get(email);

        if (!user) return null;
        if (user.password !== btoa(password)) return null;

        return { id: email, email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});

// 注册新用户
export function registerUser(
  email: string,
  password: string,
  name: string
): { success: boolean; error?: string } {
  if (users.has(email)) {
    return { success: false, error: "该邮箱已注册" };
  }
  if (password.length < 6) {
    return { success: false, error: "密码至少6位" };
  }
  users.set(email, { email, password: btoa(password), name });
  return { success: true };
}

// 从外部批量加载用户（用于数据同步）
export function loadUsers(
  userList: Array<{ email: string; password: string; name: string }>
) {
  for (const u of userList) {
    users.set(u.email, u);
  }
}
