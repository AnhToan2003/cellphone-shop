import { User } from "../models/User.js";

export const seedAdmin = async () => {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error(
      "Set ADMIN_USERNAME, ADMIN_EMAIL, and a unique ADMIN_PASSWORD with at least 12 characters before seeding an admin."
    );
  }
  const adminUsernameLower = adminUsername.toLowerCase();

  const existing =
    (await User.findOne({ usernameLower: adminUsernameLower })) ||
    (await User.findOne({ email: adminEmail }));

  if (existing) {
    let needsSave = false;

    if (!existing.username) {
      existing.username = adminUsername;
      needsSave = true;
    }

    if (!existing.usernameLower) {
      existing.usernameLower = adminUsernameLower;
      needsSave = true;
    }

    if (existing.email !== adminEmail) {
      existing.email = adminEmail;
      needsSave = true;
    }

    if (existing.role !== "admin") {
      existing.role = "admin";
      needsSave = true;
    }

    let hasCorrectPassword = false;
    try {
      hasCorrectPassword = await existing.comparePassword(
        adminPassword
      );
    } catch {
      hasCorrectPassword = false;
    }

    if (!hasCorrectPassword) {
      existing.password = adminPassword;
      needsSave = true;
    }

    if (needsSave) {
      await existing.save();
      console.log(`Admin account refreshed: username=${adminUsername}`);
    }

    return;
  }

  await User.create({
    name: "NgocTrietStore",
    username: adminUsername,
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });

  console.log(`Admin account ensured: username=${adminUsername}`);
};

export default seedAdmin;
