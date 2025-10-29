import { User } from "../models/User.js";

const ADMIN_DEFAULT_PASSWORD = "123456";

export const seedAdmin = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || "Admin";
  const adminUsernameLower = adminUsername.toLowerCase();
  const adminEmail =
    (process.env.ADMIN_EMAIL || "admin@cellphoneshop.local").toLowerCase();

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
        ADMIN_DEFAULT_PASSWORD
      );
    } catch {
      hasCorrectPassword = false;
    }

    if (!hasCorrectPassword) {
      existing.password = ADMIN_DEFAULT_PASSWORD;
      needsSave = true;
    }

    if (needsSave) {
      await existing.save();
      console.log(
        `Admin account refreshed: username=${adminUsername} / password=${ADMIN_DEFAULT_PASSWORD}`
      );
    }

    return;
  }

  await User.create({
    name: "Cellphone Shop Admin",
    username: adminUsername,
    email: adminEmail,
    password: ADMIN_DEFAULT_PASSWORD,
    role: "admin",
  });

  console.log(
    `Admin account ensured: username=${adminUsername} / password=${ADMIN_DEFAULT_PASSWORD}`
  );
};

export default seedAdmin;
