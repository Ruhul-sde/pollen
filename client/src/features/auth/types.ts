export type User = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role?: string;
};

export type AuthModalProps = {
  open: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onSubmit: (payload: { name: string; email: string; phone?: string; password?: string }) => Promise<{ requiresOtp?: boolean; email?: string; isSignup?: boolean } | void>;
  onGoogleSignIn: () => Promise<void>;
  onModeChange: (mode: "login" | "signup") => void;
  user: User | null;
  onLoginSuccess?: (user: User) => void;
};

export type ProfileSettingsProps = {
  open: boolean;
  user: User | null;
  provider: string;
  onClose: () => void;
  onPasswordChange: (password: string) => Promise<void>;
  onSignOut: () => void;
  onOpenAdmin?: () => void;
  onProfileUpdated?: (updated: User) => void;
  onTrackOrder?: (trackingId: string) => void;
  onShopNow?: () => void;
  onPayNow?: (order: any) => void;
};
