export type AppWallet = {
  id: string;
  address: string;
  chainId: number;
};

export type AppRole = {
  id: string;
  name: string;
};

export type AppUser = {
  userId: string;
  privyId: string;
  email: string | null;
  username: string;
  displayName: string | null;
  hasCustomHandle: boolean;
  wallets: AppWallet[];
  roles: AppRole[];
};
