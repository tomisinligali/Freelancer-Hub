import { prisma, getScopedPrisma } from "../src/lib/db/prisma";
import bcrypt from "bcryptjs";

async function runIsolationSuite() {
  console.log("==================================================");
  console.log("RUNNING CROSS-USER ISOLATION MERGE-BLOCKING TEST");
  console.log("==================================================");

  // 1. Setup Test Users: User Alpha and User Beta
  const userAlphaEmail = `isolation-alpha-${Date.now()}@example.com`;
  const userBetaEmail = `isolation-beta-${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const userAlpha = await prisma.user.create({
    data: {
      email: userAlphaEmail,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const userBeta = await prisma.user.create({
    data: {
      email: userBetaEmail,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log(`✓ Created User Alpha (${userAlpha.id}) and User Beta (${userBeta.id})`);

  try {
    const dbAlpha = getScopedPrisma(userAlpha.id);
    const dbBeta = getScopedPrisma(userBeta.id);

    // 2. Seed User Alpha's Data
    const clientAlpha = await dbAlpha.client.create({
      data: {
        userId: userAlpha.id,
        name: "Alpha Corp",
        email: "contact@alpha.com",
      },
    });

    const projectAlpha = await dbAlpha.project.create({
      data: {
        userId: userAlpha.id,
        clientId: clientAlpha.id,
        title: "Alpha Brand Redesign",
        status: "IN_PROGRESS",
      },
    });

    const timeEntryAlpha = await dbAlpha.timeEntry.create({
      data: {
        userId: userAlpha.id,
        projectId: projectAlpha.id,
        date: new Date(),
        minutes: 120,
        note: "Initial wireframes",
      },
    });

    const paymentAlpha = await dbAlpha.payment.create({
      data: {
        userId: userAlpha.id,
        projectId: projectAlpha.id,
        amount: 2500.0,
        dueDate: new Date(),
        status: "PENDING",
      },
    });

    console.log("✓ Seeded Alpha's Client, Project, TimeEntry, and Payment");

    // 3. Seed User Beta's Data
    const clientBeta = await dbBeta.client.create({
      data: {
        userId: userBeta.id,
        name: "Beta Industries",
      },
    });

    const projectBeta = await dbBeta.project.create({
      data: {
        userId: userBeta.id,
        clientId: clientBeta.id,
        title: "Beta API Integration",
        status: "NOT_STARTED",
      },
    });

    console.log("✓ Seeded Beta's Client and Project");

    // 4. Assert User Beta cannot see User Alpha's Client
    const betaClients = await dbBeta.client.findMany();
    const betaFoundAlphaClient = betaClients.some((c) => c.id === clientAlpha.id);
    if (betaFoundAlphaClient) {
      throw new Error("SECURITY VIOLATION: Beta was able to read Alpha's Client!");
    }
    console.log("✓ Pass: Beta cannot list Alpha's Client");

    // 5. Assert User Beta cannot see User Alpha's Project
    const betaProjects = await dbBeta.project.findMany();
    const betaFoundAlphaProject = betaProjects.some((p) => p.id === projectAlpha.id);
    if (betaFoundAlphaProject) {
      throw new Error("SECURITY VIOLATION: Beta was able to read Alpha's Project!");
    }
    console.log("✓ Pass: Beta cannot list Alpha's Project");

    // 6. Assert User Beta cannot see User Alpha's Time Entries
    const betaTimeEntries = await dbBeta.timeEntry.findMany();
    const betaFoundAlphaTime = betaTimeEntries.some((t) => t.id === timeEntryAlpha.id);
    if (betaFoundAlphaTime) {
      throw new Error("SECURITY VIOLATION: Beta was able to read Alpha's Time Entry!");
    }
    console.log("✓ Pass: Beta cannot list Alpha's Time Entry");

    // 7. Assert User Beta cannot see User Alpha's Payments
    const betaPayments = await dbBeta.payment.findMany();
    const betaFoundAlphaPayment = betaPayments.some((p) => p.id === paymentAlpha.id);
    if (betaFoundAlphaPayment) {
      throw new Error("SECURITY VIOLATION: Beta was able to read Alpha's Payment!");
    }
    console.log("✓ Pass: Beta cannot list Alpha's Payment");

    // 8. Assert User Beta cannot mutate or delete User Alpha's Project
    let updateFailed = false;
    try {
      await dbBeta.project.update({
        where: { id: projectAlpha.id },
        data: { title: "Hacked Project" },
      });
    } catch (e: any) {
      updateFailed = true;
    }
    if (!updateFailed) {
      throw new Error("SECURITY VIOLATION: Beta was able to update Alpha's Project!");
    }
    console.log("✓ Pass: Beta cannot update Alpha's Project");

    let deleteFailed = false;
    try {
      await dbBeta.project.delete({
        where: { id: projectAlpha.id },
      });
    } catch (e: any) {
      deleteFailed = true;
    }
    if (!deleteFailed) {
      throw new Error("SECURITY VIOLATION: Beta was able to delete Alpha's Project!");
    }
    console.log("✓ Pass: Beta cannot delete Alpha's Project");

    // 9. Assert User Beta cannot mutate or delete User Alpha's Payment
    let paymentUpdateFailed = false;
    try {
      await dbBeta.payment.update({
        where: { id: paymentAlpha.id },
        data: { amount: 0 },
      });
    } catch (e: any) {
      paymentUpdateFailed = true;
    }
    if (!paymentUpdateFailed) {
      throw new Error("SECURITY VIOLATION: Beta was able to update Alpha's Payment!");
    }
    console.log("✓ Pass: Beta cannot update Alpha's Payment");

    console.log("==================================================");
    console.log("ALL CROSS-USER ISOLATION CHECKS PASSED!");
    console.log("==================================================");
  } finally {
    // Cleanup test users and cascade
    await prisma.user.deleteMany({
      where: {
        id: { in: [userAlpha.id, userBeta.id] },
      },
    });
    console.log("✓ Test users cleaned up successfully");
  }
}

runIsolationSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  });
