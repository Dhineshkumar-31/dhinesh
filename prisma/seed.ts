import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Cement", nameTa: "சிமெண்ட்", type: "MATERIAL", icon: "Package" },
  { name: "Steel & Rods", nameTa: "கம்பி & இரும்பு", type: "MATERIAL", icon: "Boxes" },
  { name: "Bricks & Blocks", nameTa: "செங்கல் & பிளாக்ஸ்", type: "MATERIAL", icon: "Layers" },
  { name: "Sand & M-Sand", nameTa: "மணல் & எம்-சாண்ட்", type: "MATERIAL", icon: "Mountain" },
  { name: "Aggregates / Jelly", nameTa: "ஜல்லி / சரளை", type: "MATERIAL", icon: "CircleDot" },
  { name: "Electrical & Wiring", nameTa: "மின்சாரம் & வயரிங்", type: "MATERIAL", icon: "Zap" },
  { name: "Plumbing & Pipes", nameTa: "பிளம்பிங் & குழாய்கள்", type: "MATERIAL", icon: "Wrench" },
  { name: "Tiles & Flooring", nameTa: "டைல்ஸ் & தரை", type: "MATERIAL", icon: "Grid" },
  { name: "Wood & Timber", nameTa: "மரம் & பலகைகள்", type: "MATERIAL", icon: "TreePine" },
  { name: "Doors & Windows", nameTa: "கதவுகள் & ஜன்னல்கள்", type: "MATERIAL", icon: "DoorOpen" },
  { name: "Paint & Primer", nameTa: "பெயிண்ட் & பிரைமர்", type: "MATERIAL", icon: "Paintbrush" },
  { name: "Hardware & Tools", nameTa: "ஹார்டுவேர் & கருவிகள்", type: "MATERIAL", icon: "Hammer" },
  { name: "Mason Labour", nameTa: "கொத்தனார் கூலி", type: "LABOUR", icon: "HardHat" },
  { name: "Assistant Labour", nameTa: "சித்தாள் கூலி", type: "LABOUR", icon: "Users" },
  { name: "Carpentry Work", nameTa: "தச்சு வேலை", type: "LABOUR", icon: "Scissors" },
  { name: "Electrician Work", nameTa: "எலக்ட்ரீசியன் வேலை", type: "LABOUR", icon: "Zap" },
  { name: "Plumber Work", nameTa: "பிளம்பர் வேலை", type: "LABOUR", icon: "Droplets" },
  { name: "Painter Work", nameTa: "பெயிண்டர் கூலி", type: "LABOUR", icon: "Paintbrush" },
  { name: "Tile Laying Work", nameTa: "டைல்ஸ் பதிக்கும் கூலி", type: "LABOUR", icon: "Grid" },
  { name: "Contractor Contract", nameTa: "ஒப்பந்ததாரர் கட்டணம்", type: "CONTRACTOR", icon: "Briefcase" },
  { name: "Material Transportation", nameTa: "பொருட்கள் போக்குவரத்து", type: "TRANSPORTATION", icon: "Truck" },
  { name: "JCB / Crane / Machinery", nameTa: "JCB / இயந்திர வாடகை", type: "EQUIPMENT", icon: "Cpu" },
  { name: "Government Approvals & Plan", nameTa: "அரசு அனுமதி & ப்ளான்", type: "SERVICE", icon: "FileText" },
  { name: "Engineer & Architect Fees", nameTa: "பொறியாளர் கட்டணம்", type: "SERVICE", icon: "Compass" },
  { name: "Water Supply / Tanker", nameTa: "தண்ணீர் சப்ளை", type: "SERVICE", icon: "Droplets" },
  { name: "Miscellaneous Expense", nameTa: "இதர செலவுகள்", type: "MISCELLANEOUS", icon: "Coins" }
];

const DEFAULT_STAGES = [
  { name: "1. Planning & Design", nameTa: "1. திட்டமிடல் & வரைபடம்", orderIndex: 1 },
  { name: "2. Site Preparation & Borewell", nameTa: "2. நிலம் சமன்படுத்துதல் & ஆழ்துளை", orderIndex: 2 },
  { name: "3. Foundation & Earthwork", nameTa: "3. அஸ்திவாரம் & மண் வேலை", orderIndex: 3 },
  { name: "4. Basement & Plinth Beam", nameTa: "4. பேஸ்மென்ட் & பீம்", orderIndex: 4 },
  { name: "5. Pillars & Columns", nameTa: "5. தூண்கள் (Pillars)", orderIndex: 5 },
  { name: "6. Brickwork / Masonry", nameTa: "6. செங்கல் சுவர் கட்டடம்", orderIndex: 6 },
  { name: "7. Lintel & Sunshade", nameTa: "7. லிண்டல் & சன்ஷேடு", orderIndex: 7 },
  { name: "8. Roof Slab & Concreting", nameTa: "8. கூரை தளம் (Roofing)", orderIndex: 8 },
  { name: "9. Electrical Concealed Piping", nameTa: "9. மின் குழாய் பதித்தல்", orderIndex: 9 },
  { name: "10. Plumbing Concealed Lines", nameTa: "10. தண்ணீர் குழாய் பதித்தல்", orderIndex: 10 },
  { name: "11. Doors & Windows Frames", nameTa: "11. கதவு & ஜன்னல் சட்டங்கள்", orderIndex: 11 },
  { name: "12. Internal Plastering", nameTa: "12. உள் பூச்சு வேலை", orderIndex: 12 },
  { name: "13. External Plastering", nameTa: "13. வெளி பூச்சு வேலை", orderIndex: 13 },
  { name: "14. Flooring & Wall Tiles", nameTa: "14. தரை மற்றும் டைல்ஸ்", orderIndex: 14 },
  { name: "15. Electrical Fittings", nameTa: "15. மின் சாதனங்கள் பொருத்துதல்", orderIndex: 15 },
  { name: "16. Plumbing & Sanitary Ware", nameTa: "16. குழாய்கள் & சானிட்டரி", orderIndex: 16 },
  { name: "17. Painting & Putty", nameTa: "17. வண்ணம் பூசுதல் (Painting)", orderIndex: 17 },
  { name: "18. Kitchen & Woodwork", nameTa: "18. சமையலறை & உட்புற தச்சு வேலை", orderIndex: 18 },
  { name: "19. Final Finishing & House Warming", nameTa: "19. இறுதி அழகு & கிரகப்பிரவேசம்", orderIndex: 19 }
];

async function main() {
  console.log("🌱 Seeding VeetuKanakku database...");

  // 1. Seed Admin User
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword@123";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@veetukanakku.com";

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }, { role: "ADMIN" }]
    }
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        name: "System Administrator",
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        preferredLanguage: "en",
        isActive: true
      }
    });
    console.log(`✅ Admin user created: ${adminUsername}`);
  } else {
    console.log(`ℹ️ Admin user already exists.`);
  }

  // 2. Seed Default Categories
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: cat.name }
    });
    if (!existing) {
      await prisma.expenseCategory.create({
        data: {
          name: cat.name,
          nameTa: cat.nameTa,
          type: cat.type,
          icon: cat.icon,
          isDefault: true
        }
      });
    }
  }
  console.log(`✅ Default categories seeded.`);

  // 3. Seed Default Construction Stages
  for (const stage of DEFAULT_STAGES) {
    const existing = await prisma.constructionStage.findFirst({
      where: { name: stage.name }
    });
    if (!existing) {
      await prisma.constructionStage.create({
        data: {
          name: stage.name,
          nameTa: stage.nameTa,
          orderIndex: stage.orderIndex,
          isDefault: true
        }
      });
    }
  }
  console.log(`✅ Construction stages seeded.`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
