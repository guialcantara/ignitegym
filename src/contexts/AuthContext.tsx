import { UserDTO } from "@dtos/UserDTO";
import { api } from "@services/api";
import { storageAuthTokenGet, storageAuthTokenRemove, storageAuthTokenSave } from "@storage/storageAuthToken";
import { storageUserGet, storageUserRemove, storageUserSave } from "@storage/storageUser";
import { ReactNode, createContext, useEffect, useState } from "react";

export type AuthContextDataProps = {
  user: UserDTO
  updateUserProfile: (userUpdated: UserDTO) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  isLoadingUserStorageData: boolean
  signOut: () => Promise<void>
}

type AuthContextProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextDataProps>({} as AuthContextDataProps)

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserDTO>({} as UserDTO)
  const [isLoadingUserStorageData, setIsLoadingUserStorageData] = useState(true)

  async function userAndTokenUpdate(userData: UserDTO, token: string) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  async function signIn(email: string, password: string) {
    try {
      const { data } = await api.post('/sessions', { email, password })

      if (data && data.token && data.refresh_token) {
        setIsLoadingUserStorageData(true)

        await storageUserSave(data.user)
        await storageAuthTokenSave({token: data.token, refresh_token: data.refresh_token})

        userAndTokenUpdate(data.user, data.token)
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoadingUserStorageData(false)
    }
  }

  async function signOut() {
    try {
      setIsLoadingUserStorageData(true)

      setUser({} as UserDTO)
      await storageUserRemove()
      await storageAuthTokenRemove()
    } catch (error) {
      throw error
    } finally {
      setIsLoadingUserStorageData(false)
    }
  }

  async function updateUserProfile(userUpdated: UserDTO) {
    try {
      setUser(userUpdated)
      await storageUserSave(userUpdated)
    } catch (error) {

    }
  }

  async function loadUserData() {
    try {
      setIsLoadingUserStorageData(true)
      const userLogged = await storageUserGet()
      const {token} = await storageAuthTokenGet()

      if (token && userLogged) {
        userAndTokenUpdate(userLogged, token)
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoadingUserStorageData(false)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    const subscribe = api.registerInterceptTokenManager(signOut)
    return () => {
      subscribe()
    }
  }, [signOut])
  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoadingUserStorageData, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
