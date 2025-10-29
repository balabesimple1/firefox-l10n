const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create locales
  const locales = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'th-TH', name: 'Thai (Thailand)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' }
  ];

  console.log('Creating locales...');
  for (const locale of locales) {
    await prisma.locale.upsert({
      where: { code: locale.code },
      update: {},
      create: locale
    });
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@localization.com' },
    update: {},
    create: {
      email: 'admin@localization.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN'
    }
  });

  // Create product team user
  const productPassword = await bcrypt.hash('product123', 12);
  const productUser = await prisma.user.upsert({
    where: { email: 'product@localization.com' },
    update: {},
    create: {
      email: 'product@localization.com',
      password: productPassword,
      name: 'Product Manager',
      role: 'PRODUCT_TEAM'
    }
  });

  // Create finance team user
  const financePassword = await bcrypt.hash('finance123', 12);
  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@localization.com' },
    update: {},
    create: {
      email: 'finance@localization.com',
      password: financePassword,
      name: 'Finance Manager',
      role: 'FINANCE_TEAM'
    }
  });

  // Create translator users
  const translatorPassword = await bcrypt.hash('translator123', 12);
  
  const translators = [
    {
      email: 'maria@translator.com',
      name: 'Maria Garcia',
      specializations: ['Spanish', 'Portuguese'],
      experience: 5,
      locales: ['es-ES', 'pt-BR']
    },
    {
      email: 'jean@translator.com',
      name: 'Jean Dupont',
      specializations: ['French'],
      experience: 8,
      locales: ['fr-FR']
    },
    {
      email: 'hans@translator.com',
      name: 'Hans Mueller',
      specializations: ['German'],
      experience: 6,
      locales: ['de-DE']
    },
    {
      email: 'yuki@translator.com',
      name: 'Yuki Tanaka',
      specializations: ['Japanese'],
      experience: 7,
      locales: ['ja-JP']
    }
  ];

  console.log('Creating translators...');
  for (const translatorData of translators) {
    const user = await prisma.user.upsert({
      where: { email: translatorData.email },
      update: {},
      create: {
        email: translatorData.email,
        password: translatorPassword,
        name: translatorData.name,
        role: 'TRANSLATOR',
        translatorProfile: {
          create: {
            specializations: translatorData.specializations,
            experience: translatorData.experience
          }
        }
      },
      include: {
        translatorProfile: true
      }
    });

    // Create translator rates
    for (const localeCode of translatorData.locales) {
      const locale = await prisma.locale.findUnique({
        where: { code: localeCode }
      });
      
      if (locale && user.translatorProfile) {
        await prisma.translatorRate.upsert({
          where: {
            translatorId_localeId: {
              translatorId: user.translatorProfile.id,
              localeId: locale.id
            }
          },
          update: {},
          create: {
            translatorId: user.translatorProfile.id,
            localeId: locale.id,
            ratePerWord: 0.15 + Math.random() * 0.1, // Random rate between 0.15-0.25
            currency: 'USD'
          }
        });
      }
    }
  }

  // Create sample projects
  console.log('Creating sample projects...');
  
  const firefoxProject = await prisma.project.upsert({
    where: { name: 'Firefox Browser' },
    update: {},
    create: {
      name: 'Firefox Browser',
      description: 'Main Firefox browser localization project',
      repository: 'https://github.com/mozilla/firefox-l10n-source',
      status: 'ACTIVE',
      autoApprove: false,
      costThreshold: 1000,
      createdById: productUser.id
    }
  });

  const devtoolsProject = await prisma.project.upsert({
    where: { name: 'Firefox DevTools' },
    update: {},
    create: {
      name: 'Firefox DevTools',
      description: 'Firefox Developer Tools localization',
      repository: 'https://github.com/mozilla/firefox-devtools',
      status: 'ACTIVE',
      autoApprove: true,
      costThreshold: 500,
      createdById: productUser.id
    }
  });

  // Add locales to projects
  const mainLocales = await prisma.locale.findMany({
    where: {
      code: { in: ['es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'pt-BR'] }
    }
  });

  for (const locale of mainLocales) {
    // Firefox project locales
    await prisma.projectLocale.upsert({
      where: {
        projectId_localeId: {
          projectId: firefoxProject.id,
          localeId: locale.id
        }
      },
      update: {},
      create: {
        projectId: firefoxProject.id,
        localeId: locale.id,
        totalStrings: 1000 + Math.floor(Math.random() * 500),
        translatedStrings: 800 + Math.floor(Math.random() * 200),
        reviewedStrings: 750 + Math.floor(Math.random() * 100),
        warningCount: Math.floor(Math.random() * 10),
        errorCount: Math.floor(Math.random() * 5)
      }
    });

    // DevTools project locales
    await prisma.projectLocale.upsert({
      where: {
        projectId_localeId: {
          projectId: devtoolsProject.id,
          localeId: locale.id
        }
      },
      update: {},
      create: {
        projectId: devtoolsProject.id,
        localeId: locale.id,
        totalStrings: 500 + Math.floor(Math.random() * 200),
        translatedStrings: 400 + Math.floor(Math.random() * 100),
        reviewedStrings: 350 + Math.floor(Math.random() * 50),
        warningCount: Math.floor(Math.random() * 5),
        errorCount: Math.floor(Math.random() * 3)
      }
    });
  }

  // Create sample translation tasks
  console.log('Creating sample translation tasks...');
  
  const sampleTasks = [
    {
      title: 'Translate new privacy features',
      description: 'Translate strings for new privacy dashboard',
      wordCount: 250,
      status: 'IN_PROGRESS',
      priority: 4
    },
    {
      title: 'Update bookmark manager strings',
      description: 'Update translations for redesigned bookmark manager',
      wordCount: 180,
      status: 'COMPLETED',
      priority: 3
    },
    {
      title: 'New tab page localization',
      description: 'Translate new tab page redesign strings',
      wordCount: 320,
      status: 'PENDING',
      priority: 5
    }
  ];

  for (const taskData of sampleTasks) {
    const randomLocale = mainLocales[Math.floor(Math.random() * mainLocales.length)];
    const randomProject = Math.random() > 0.5 ? firefoxProject : devtoolsProject;
    
    await prisma.translationTask.create({
      data: {
        ...taskData,
        projectId: randomProject.id,
        localeId: randomLocale.id,
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within 30 days
      }
    });
  }

  // Create sample glossary terms
  console.log('Creating sample glossary terms...');
  
  const glossaryTerms = [
    {
      term: 'bookmark',
      definition: 'A saved shortcut to a web page',
      context: 'Used in browser navigation',
      locale: 'en-US',
      category: 'Navigation'
    },
    {
      term: 'tab',
      definition: 'A separate browsing session within the same window',
      context: 'Browser interface element',
      locale: 'en-US',
      category: 'Interface'
    },
    {
      term: 'cookie',
      definition: 'Small data file stored by websites',
      context: 'Privacy and data storage',
      locale: 'en-US',
      category: 'Privacy'
    }
  ];

  for (const term of glossaryTerms) {
    await prisma.glossary.upsert({
      where: {
        term_locale: {
          term: term.term,
          locale: term.locale
        }
      },
      update: {},
      create: term
    });
  }

  // Create system settings
  console.log('Creating system settings...');
  
  const systemSettings = [
    { key: 'default_currency', value: 'USD' },
    { key: 'auto_approve_threshold', value: '500' },
    { key: 'notification_email', value: 'admin@localization.com' },
    { key: 'ai_translation_enabled', value: 'true' },
    { key: 'tm_match_threshold', value: '0.8' }
  ];

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }

  console.log('Database seed completed successfully!');
  console.log('\nDefault login credentials:');
  console.log('Admin: admin@localization.com / admin123');
  console.log('Product: product@localization.com / product123');
  console.log('Finance: finance@localization.com / finance123');
  console.log('Translator: maria@translator.com / translator123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });