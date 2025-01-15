import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import NextAuth from "next-auth";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("请输入用户名和密码");
          }

          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username,
            },
            select: {
              id: true,
              username: true,
              password: true,
              role: true,
            },
          });

          if (!user) {
            throw new Error("用户名或密码错误");
          }

          const isValid = await compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("用户名或密码错误");
          }

          return {
            id: user.id,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error("认证错误:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        username: token.username as string,
        role: token.role as string,
      };
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 