import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/lib/auth";
import { User } from "@supabase/supabase-js";
import { Tables } from "@/integrations/supabase/types";

export interface CreateUserOptions {
  email: string;
  fullName: string;
  role?: UserRole;
  chapterId?: string | null;
  businessName?: string | null;
  businessDescription?: string | null;
  phone?: string | null;
  password?: string;
}

export interface BulkUserData {
  email: string;
  fullName: string;
  role?: UserRole;
  chapterId?: string | null;
  businessName?: string | null;
  businessDescription?: string | null;
  phone?: string | null;
}

export interface CreateUserResult {
  user: User;
  profile: Tables<"profiles">;
  temporaryPassword: string;
}

export class SystemUtils {
  static async createAdmin(): Promise<{
    success: boolean;
    error?: string;
    data?: CreateUserResult;
  }> {
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      const adminFullName =
        import.meta.env.VITE_ADMIN_FULL_NAME || "System Administrator";

      if (!adminEmail || !adminPassword) {
        return {
          success: false,
          error:
            "VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD must be set in .env file",
        };
      }

      // Check if admin already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", adminEmail)
        .single();

      if (existingUser) {
        console.error("admin exists");

        return {
          success: true,
          data: {
            user: {} as User, // Admin already exists, no user object needed
            profile: existingUser,
            temporaryPassword: "",
          },
          error: "Administrator already exists",
        };
      }

      // Create the admin user
      const result = await this.createUser({
        email: adminEmail,
        fullName: adminFullName,
        role: "administrator",
        password: adminPassword,
      });

      return result;
    } catch (error) {
      console.error("Error creating admin from env:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static async createUser(
    options: CreateUserOptions
  ): Promise<{ success: boolean; error?: string; data?: CreateUserResult }> {
    try {
      const {
        email,
        fullName,
        role = "member",
        chapterId = null,
        businessName = null,
        businessDescription = null,
        phone = null,
        password = this.generateRandomPassword(),
      } = options;

      // Create the authentication user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        console.log(`failed: ${authError.message}`);

        return {
          success: false,
          error: authError.message,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: "Failed to create user",
        };
      }

      // Update the profile with additional information
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          role,
          chapter_id: chapterId,
          business_name: businessName,
          business_description: businessDescription,
          phone,
        })
        .eq("id", authData.user.id)
        .select()
        .single();

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Note: Auth user was created but profile update failed
        return {
          success: false,
          error: `User created but profile update failed: ${profileError.message}`,
        };
      }

      return {
        success: true,
        data: {
          user: authData.user,
          profile: profileData,
          temporaryPassword: password,
        },
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static async bulkCreateUsers(users: BulkUserData[]): Promise<{
    success: boolean;
    results: Array<{
      email: string;
      success: boolean;
      error?: string;
      data?: CreateUserResult;
      temporaryPassword?: string;
    }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const userData of users) {
      try {
        const temporaryPassword = this.generateRandomPassword();

        const result = await this.createUser({
          ...userData,
          password: temporaryPassword,
        });

        if (result.success) {
          successful++;
          results.push({
            email: userData.email,
            success: true,
            data: result.data,
            temporaryPassword,
          });

          console.log(`success: ${userData.email}`);
        } else {
          failed++;
          results.push({
            email: userData.email,
            success: false,
            error: result.error,
            data: undefined,
          });

          console.log(`failed: ${userData.email}`);
        }
      } catch (error) {
        failed++;
        results.push({
          email: userData.email,
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          data: undefined,
        });

        console.log(`failed: ${userData.email}`);
      }
    }

    console.log(results);

    return {
      success: successful > 0,
      results,
      summary: {
        total: users.length,
        successful,
        failed,
      },
    };
  }

  static async resetUserPassword(
    userId: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string; temporaryPassword?: string }> {
    try {
      const password = newPassword || this.generateRandomPassword();

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        temporaryPassword: password,
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static async deleteUser(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        return {
          success: false,
          error: profileError.message,
        };
      }

      // Then delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static generateRandomPassword(length: number = 12): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  static async updateUserRole(
    userId: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string; data?: Tables<"profiles"> }> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error updating user role:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static async getUserStats(): Promise<{
    success: boolean;
    data?: {
      totalUsers: number;
      adminCount: number;
      chapterLeaderCount: number;
      memberCount: number;
      usersByChapter: Array<{ chapterId: string | null; count: number }>;
    };
    error?: string;
  }> {
    try {
      // Get total user count and role distribution
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("role, chapter_id");

      if (profileError) {
        return {
          success: false,
          error: profileError.message,
        };
      }

      const totalUsers = profiles.length;
      const adminCount = profiles.filter(
        (p) => p.role === "administrator"
      ).length;
      const chapterLeaderCount = profiles.filter(
        (p) => p.role === "chapter_leader"
      ).length;
      const memberCount = profiles.filter((p) => p.role === "member").length;

      // Group by chapter
      const usersByChapter = profiles.reduce(
        (acc: Array<{ chapterId: string | null; count: number }>, profile) => {
          const existing = acc.find(
            (item) => item.chapterId === profile.chapter_id
          );
          if (existing) {
            existing.count++;
          } else {
            acc.push({ chapterId: profile.chapter_id, count: 1 });
          }
          return acc;
        },
        []
      );

      return {
        success: true,
        data: {
          totalUsers,
          adminCount,
          chapterLeaderCount,
          memberCount,
          usersByChapter,
        },
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
