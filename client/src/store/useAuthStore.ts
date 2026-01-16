import { create } from "zustand";
import { axiosInstance } from "../utils/axios";
import toast from "react-hot-toast";
import type { SignUpSchemaType } from "../inputValidations/signUpValidation.js";
import type { LoginSchemaType } from "../inputValidations/loginValidation.js";
import type { AuthStore } from "../types/authStoreType.js";


export const useAuthStore = create((set , _)=>({ // (set, get)
    authUser: null,
    isSigninUp: false,
    isLoggingIn: false,
    isCheckingAuth: false,
  
    checkAuth: async () => {
        console.log("checkAuth called");
        // set({ isCheckingAuth: true }); // ✅ FIXED
      
        // try {
        //   const res = await axiosInstance.get("/auth/check");
        //   console.log("✅ checkAuth response:", res.data);
        //   if (res.data && res.data.data) {
        //     set({ authUser: res.data.user });
        //   } else {
        //     set({ authUser: null });
        //   }
        // } catch (error) {
        //   console.log("❌ Error checking auth:", error);
        //   set({ authUser: null });
        // } finally {
        //   set({ isCheckingAuth: false });
        // }

        try {
            const res = await axiosInstance.get("/auth/check-auth");
            console.log("✅ checkAuth response:", res);
            console.log("Response structure:", {
                fullResponse: res,
                dataProperty: res.data,
                nestedDataProperty: res.data?.data
            });
            
            // Check if res.data exists and contains a data property
            if (res.data && res.data.data) {
            set({ authUser: res.data.data }); // Set authUser to the nested data object
            } else {
            // If no user data is available, set authUser to null
            set({ authUser: null });
            }
        } catch (error) {
            console.error("Error checking auth:", error);
            set({ authUser: null });
        }
      }
,      
    

    signup: async(data: SignUpSchemaType)=>{
        set({isSigninUp: true});
        try {
            const res = await axiosInstance.post("/auth/register" , data);
            set({
                authUser:res.data.user,
                isAuthenticated: true,
                isLoggingIn: false
            });
            
            // show a toast message
            toast.success(res.data.message);

            // redirect to the home page
            window.location.href = "/";
        } catch (error) {
            console.log("Error signing up",error);
            toast.error("Error signing up");
        }
        finally{
            set({isSigninUp: false});
        }
    },

    login: async(data: LoginSchemaType)=>{
        console.log("Login data in the useAuthStore file: ", data)
        set({isLoggingIn: true});
        try {
            const res = await axiosInstance.post("/auth/login" , data);
            console.log("Login response from useAuthStore:",res);
            set({authUser:res.data.user});
            toast.success(res.data.message);
            // redirect to the home page
            window.location.href = "/";
            
            return true;
        } catch (error) {
            console.log("Error logging in",error);
            toast.error("Error logging in");
            return false;
        }
        finally{
            set({isLoggingIn: false});
        }
    },

    logout:async()=>{
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
           
            toast.success("Logout successful");
        } catch (error) {
            console.log("Error logging out",error);
            toast.error("Error logging out");
        }
    }
    
}))






// useAuthStore.ts
// import { create } from 'zustand';
// import { axiosInstance } from '../utils/axios'
// import { toast } from 'react-hot-toast';

// export interface AuthUser {
//   id: string;
//   name: string;
//   email: string;
//   username: string;
//   role: string;
//   isEmailVerified: boolean;
// }

// export interface AuthStore {
//   authUser: AuthUser | null;
//   isCheckingAuth: boolean;
//   isLoggingIn: boolean;
//   isSigningUp: boolean;
  
//   checkAuth: () => Promise<void>;
//   login: (data: { email: string; password: string }) => Promise<boolean>;
//   logout: () => Promise<void>;
//   signup: (data: { name: string; email: string; password: string }) => Promise<boolean>;
// }

// export const useAuthStore = create<AuthStore>((set) => ({
//   authUser: null,
//   isCheckingAuth: false,
//   isLoggingIn: false,
//   isSigningUp: false,
  
//   checkAuth: async () => {
//     try {
//       set({ isCheckingAuth: true });
//       const response = await axiosInstance.get('/auth');
//       console.log("✅ checkAuth response:", response.data);
      
//       // Only set authUser if data contains user information
//       if (response.data?.data?.user) {
//         set({ authUser: response.data.data.user });
//       }
//     } catch (error) {
//       console.error("Error checking auth:", error);
//       set({ authUser: null });
//     } finally {
//       set({ isCheckingAuth: false });
//     }
//   },
  
//   login: async (data) => {
//     console.log("Login data in the useAuthStore file: ", data)
//     try {
//       set({ isLoggingIn: true });
//       const response = await axiosInstance.post('/auth/login', data);
//       console.log("Login response:", response.data);
      
//       // Make sure we're setting the user data correctly
//       if (response.data?.user) {
//         set({ authUser: response.data.user });
//         toast.success('Login successful');
//         return true;
//       } else {
//         throw new Error('User data not found in response');
//       }
//     } catch (error) {
//       console.error('Error logging in', error);
//       toast.error('Error logging in');
//       return false;
//     } finally {
//       set({ isLoggingIn: false });
//     }
//   },
  
//   logout: async () => {
//     try {
//       await axiosInstance.get('/auth/logout');
//       set({ authUser: null });
//       toast.success('Logout successful');
//     } catch (error) {
//       console.error('Error logging out', error);
//       toast.error('Error logging out');
//     }
//   },
  
//   signup: async (data) => {
//     try {
//       set({ isSigningUp: true });
//       const response = await axiosInstance.post('/auth/register', data);
//       toast.success('Signup successful, please log in');
//       return true;
//     } catch (error) {
//       console.error('Error signing up', error);
//       toast.error('Error signing up');
//       return false;
//     } finally {
//       set({ isSigningUp: false });
//     }
//   }
// }));




// import { create } from "zustand";
// import { axiosInstance } from "../utils/axios";
// import toast from "react-hot-toast";
// import type { SignUpSchemaType } from "../inputValidations/signUpValidation.js";
// import type { LoginSchemaType } from "../inputValidations/loginValidation.js";
// import type { AuthStore } from "../types/authStoreType.js";

// export const useAuthStore = create<AuthStore>((set, _) => ({
//     authUser: null,
//     isSigninUp: false,
//     isLoggingIn: false,
//     isCheckingAuth: false,
  
//     checkAuth: async () => {
//         console.log("checkAuth called");
//         set({ isCheckingAuth: true });
      
//         try {
//             const res = await axiosInstance.get("/auth/check");
//             console.log("✅ checkAuth response:", res);
            
//             // Handle the response based on your server's response structure
//             // This should match the exact structure your server returns
//             if (res.data && res.data.user) {
//                 set({ authUser: res.data.user });
//             } else if (res.data && res.data.data) {
//                 set({ authUser: res.data.data });
//             } else {
//                 set({ authUser: null });
//             }
//         } catch (error) {
//             console.error("Error checking auth:", error);
//             set({ authUser: null });
//         } finally {
//             set({ isCheckingAuth: false });
//         }
//     },
    
//     signup: async(data: SignUpSchemaType) => {
//         set({ isSigninUp: true });
//         try {
//             const res = await axiosInstance.post("/auth/register", data);
//             console.log("Signup response from useAuthStore:", res);
            
//             // Make sure we're extracting the user data correctly
//             // Adjust this based on your server's response structure
//             if (res.data && res.data?.user) {
//                 set({
//                     authUser: res.data.user,
//                     isAuthenticated: true,
//                 });
                
//                 toast.success(res.data.message || "Signup successful");
//                 window.location.href = "/";
//                 return true;
//             } else {
//                 throw new Error("User data not found in response");
//             }
//         } catch (error) {
//             console.log("Error signing up", error);
//             toast.error("Error signing up");
//             return false;
//         } finally {
//             set({ isSigninUp: false });
//         }
//     },

//     login: async(data: LoginSchemaType) => {
//         console.log("Login data in the useAuthStore file:", data);
        
//         // Validate that all required fields are present
//         if (!data.email || !data.password) {
//             toast.error("Email and password are required");
//             return false;
//         }
        
//         set({ isLoggingIn: true });
//         try {
//             const res = await axiosInstance.post("/auth/login", data);
//             console.log("Login response from useAuthStore:", res);
            
//             // Extract user data based on server response structure
//             // Adjust this path according to your server's actual response
//             if (res.data && (res.data.user || res.data.data)) {
//                 set({ 
//                     authUser: res.data.user || res.data.data,
//                     isAuthenticated: true
//                 });
                
//                 toast.success(res.data.message || "Login successful");
//                 window.location.href = "/";
//                 return true;
//             } else {
//                 throw new Error("User data not found in response");
//             }
//         } catch (error) {
//             console.log("Error logging in", error);
//             toast.error("Error logging in");
//             return false;
//         } finally {
//             set({ isLoggingIn: false });
//         }
//     },

//     logout: async() => {
//         try {
//             await axiosInstance.post("/auth/logout");
//             set({ 
//                 authUser: null,
//                 isAuthenticated: false 
//             });
            
//             toast.success("Logout successful");
//         } catch (error) {
//             console.log("Error logging out", error);
//             toast.error("Error logging out");
//         }
//     }
// }));
