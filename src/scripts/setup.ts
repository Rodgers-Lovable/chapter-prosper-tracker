import { createAdmin, createBulkUsers } from "../lib/system/examples";

async function runSetup() {
  console.log("🚀 Starting system setup...");

  if (import.meta.env.VITE_CREATE_ADMIN == "enabled") {
    try {
      await createAdmin();

      console.log("✅ Admin setup complete!");
    } catch (error) {
      console.error("admin-creation-failed:", error);
    }
  }

  if (import.meta.env.VITE_ADD_BULK_USERS == "enabled") {
    try {
      await createBulkUsers();

      console.log("✅ bulk user complete!");
    } catch (error) {
      console.error("bulk-user-create-failed:", error);
    }
  }
}

export { runSetup };
