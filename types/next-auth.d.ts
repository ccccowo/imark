import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    username: string;
  }
  
  interface Session {
    user: User & {
      role: Role;
      username: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    username: string;
  }
} 