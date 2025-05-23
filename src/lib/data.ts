export const getNullAddress = () => "0x0000000000000000000000000000000000000000";
export const getAppUrl = () => process.env.NEXT_PUBLIC_URL as string;
export const getApiUrl = () => process.env.FARSTORE_API_URL as string;
export const getRpcUrl = () => process.env.BASE_JSON_RPC_URL as string;

export interface ProposalData {
  id: bigint;
  target: string;
  permapool: string;
  weight: bigint;
  expiration: bigint;
  passed: boolean;
}