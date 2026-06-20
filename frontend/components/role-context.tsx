"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Role = "doctor" | "specialist"

interface RoleCtx {
  role: Role
  setRole: (r: Role) => void
  name: string
}

const Ctx = createContext<RoleCtx>({ role: "doctor", setRole: () => {}, name: "Dr. Sarah Chen" })

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("doctor")

  useEffect(() => {
    const saved = localStorage.getItem("loopmd-role") as Role | null
    if (saved) setRoleState(saved)
  }, [])

  const setRole = (r: Role) => {
    setRoleState(r)
    localStorage.setItem("loopmd-role", r)
  }

  const name = role === "doctor" ? "Dr. Sarah Chen" : "Dr. Amir Hosseini"

  return <Ctx.Provider value={{ role, setRole, name }}>{children}</Ctx.Provider>
}

export const useRole = () => useContext(Ctx)
