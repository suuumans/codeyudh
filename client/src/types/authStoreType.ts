import type { UserType } from "./userType";
import type { SignUpSchemaType } from "../inputValidations/signUpValidation";
import type { LoginSchemaType } from "../inputValidations/loginValidation";

export type AuthStore = {
  authUser: UserType | null;
  isSigninUp: boolean;
  isLoggingIn: boolean;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<void>;
  signup: (data: SignUpSchemaType) => Promise<void>;
  login: (data: LoginSchemaType) => Promise<boolean>;
  logout: () => Promise<void>;
};
