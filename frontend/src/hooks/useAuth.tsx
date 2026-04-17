import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import api from '../api/axios';

interface AuthContextValue {
  token: string | null;
  userEmail: string | null;
  userName: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  avatarUrl: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateUser: (updates: Partial<AuthContextValue>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  userEmail: null,
  userName: null,
  githubUrl: null,
  linkedinUrl: null,
  portfolioUrl: null,
  avatarUrl: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  updateUser: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('growthos_token'));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('growthos_user'));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('growthos_name'));
  const [githubUrl, setGithubUrl] = useState<string | null>(() => localStorage.getItem('growthos_github'));
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(() => localStorage.getItem('growthos_linkedin'));
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(() => localStorage.getItem('growthos_portfolio'));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => localStorage.getItem('growthos_avatar'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('growthos_token', token);
    } else {
      localStorage.removeItem('growthos_token');
    }
  }, [token]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('growthos_user', userEmail);
    } else {
      localStorage.removeItem('growthos_user');
    }
  }, [userEmail]);

  useEffect(() => {
    if (userName) localStorage.setItem('growthos_name', userName);
    else localStorage.removeItem('growthos_name');
  }, [userName]);

  useEffect(() => {
    if (githubUrl) localStorage.setItem('growthos_github', githubUrl);
    else localStorage.removeItem('growthos_github');
  }, [githubUrl]);

  useEffect(() => {
    if (linkedinUrl) localStorage.setItem('growthos_linkedin', linkedinUrl);
    else localStorage.removeItem('growthos_linkedin');
  }, [linkedinUrl]);

  useEffect(() => {
    if (portfolioUrl) localStorage.setItem('growthos_portfolio', portfolioUrl);
    else localStorage.removeItem('growthos_portfolio');
  }, [portfolioUrl]);

  useEffect(() => {
    if (avatarUrl) localStorage.setItem('growthos_avatar', avatarUrl);
    else localStorage.removeItem('growthos_avatar');
  }, [avatarUrl]);

  useEffect(() => {
    const syncProfile = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          const user = response.data.user;
          if (user) {
            setUserEmail(user.email);
            setUserName(user.name);
            setGithubUrl(user.githubUrl || null);
            setLinkedinUrl(user.linkedinUrl || null);
            setPortfolioUrl(user.portfolioUrl || null);
            setAvatarUrl(user.avatarUrl || null);
          }
        } catch (error) {
          console.error('Profile sync failed:', error);
        }
      }
    };
    syncProfile();
  }, [token]);

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const accessToken = response.data?.token;
    const user = response.data?.user;

    if (!accessToken || !user) {
      throw new Error('Authentication failed');
    }

    setToken(accessToken);
    setUserEmail(user.email);
    setUserName(user.name);
    setGithubUrl(user.githubUrl || null);
    setLinkedinUrl(user.linkedinUrl || null);
    setPortfolioUrl(user.portfolioUrl || null);
    setAvatarUrl(user.avatarUrl || null);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    const accessToken = response.data?.token;
    const user = response.data?.user;

    if (!accessToken || !user) {
      throw new Error('Registration failed');
    }

    setToken(accessToken);
    setUserEmail(user.email);
    setUserName(user.name);
    setGithubUrl(user.githubUrl || null);
    setLinkedinUrl(user.linkedinUrl || null);
    setPortfolioUrl(user.portfolioUrl || null);
    setAvatarUrl(user.avatarUrl || null);
  };

  const signOut = () => {
    setToken(null);
    setUserEmail(null);
    setUserName(null);
    setGithubUrl(null);
    setLinkedinUrl(null);
    setPortfolioUrl(null);
    setAvatarUrl(null);
  };

  const updateUser = (updates: any) => {
    if (updates.name) setUserName(updates.name);
    if (updates.email) setUserEmail(updates.email);
    if (updates.githubUrl !== undefined) setGithubUrl(updates.githubUrl);
    if (updates.linkedinUrl !== undefined) setLinkedinUrl(updates.linkedinUrl);
    if (updates.portfolioUrl !== undefined) setPortfolioUrl(updates.portfolioUrl);
    if (updates.avatarUrl !== undefined) setAvatarUrl(updates.avatarUrl);
  };

  const value = useMemo(
    () => ({ token, userEmail, userName, githubUrl, linkedinUrl, portfolioUrl, avatarUrl, signIn, signUp, signOut, updateUser }),
    [token, userEmail, userName, githubUrl, linkedinUrl, portfolioUrl, avatarUrl]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
