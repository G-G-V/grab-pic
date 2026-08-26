import { apiRequest } from "./client";

export type UserRole = "organizer" | "attendee";

export interface LoginResponse {
  token: string;
  role: UserRole;
}

export interface SignupResponse {
  userId: string;
  token: string;
  role: UserRole;
}

function getRoleFromToken(token: string): UserRole {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      throw new Error("Invalid JWT.");
    }

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );

    if (decoded.role !== "organizer" && decoded.role !== "attendee") {
      throw new Error("Invalid role in token.");
    }

    return decoded.role;
  } catch {
    throw new Error("Unable to determine user role from authentication token.");
  }
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const data = await apiRequest<{ success: true; token: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const role = getRoleFromToken(data.token);

  localStorage.setItem("grabpic_token", data.token);
  localStorage.setItem("grabpic_role", role);

  return {
    token: data.token,
    role,
  };
}

export async function signup(
  email: string,
  password: string,
  role: UserRole,
): Promise<SignupResponse> {
  const data = await apiRequest<{
    success: true;
    userId: string;
    token: string;
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      role,
    }),
  });

  localStorage.setItem("grabpic_token", data.token);
  localStorage.setItem("grabpic_role", role);

  return {
    userId: data.userId,
    token: data.token,
    role,
  };
}

export function logout(): void {
  localStorage.removeItem("grabpic_token");
  localStorage.removeItem("grabpic_role");
}

export function getStoredToken(): string | null {
  return localStorage.getItem("grabpic_token");
}

export function getStoredRole(): UserRole | null {
  const role = localStorage.getItem("grabpic_role");

  if (role === "organizer" || role === "attendee") {
    return role;
  }

  return null;
}
