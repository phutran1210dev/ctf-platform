'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // Create admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await queryInterface.bulkInsert('users', [{
      id: adminId,
      username: 'admin',
      email: 'admin@ctf.local',
      password: hashedPassword,
      first_name: 'CTF',
      last_name: 'Admin',
      role: 'admin',
      is_active: true,
      is_verified: true,
      score: 0,
      solve_count: 0,
      created_at: now,
      updated_at: now
    }]);

    // Create sample team
    const teamId = uuidv4();
    await queryInterface.bulkInsert('teams', [{
      id: teamId,
      name: 'Admin Team',
      description: 'Default admin team',
      captain_id: adminId,
      is_public: true,
      max_members: 4,
      invite_code: 'ADMIN001',
      score: 0,
      solve_count: 0,
      is_active: true,
      created_at: now,
      updated_at: now
    }]);

    // Update admin user with team
    await queryInterface.bulkUpdate('users', 
      { team_id: teamId },
      { id: adminId }
    );

    // Create sample challenges
    const challenges = [
      {
        id: uuidv4(),
        title: 'Welcome Challenge',
        description: 'A simple welcome challenge to get you started. Find the flag in the description!',
        category: 'misc',
        difficulty: 'easy',
        points: 50,
        flag: 'CTF{welcome_to_the_platform}',
        is_case_sensitive: true,
        is_active: true,
        is_visible: true,
        solve_count: 0,
        author_id: adminId,
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        title: 'Base64 Basics',
        description: 'Decode this Base64 string: Q1RGe2Jhc2U2NF9pc19lYXN5fQ==',
        category: 'crypto',
        difficulty: 'easy',
        points: 100,
        flag: 'CTF{base64_is_easy}',
        is_case_sensitive: true,
        is_active: true,
        is_visible: true,
        solve_count: 0,
        author_id: adminId,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        title: 'Web Inspector',
        description: 'Inspect this webpage to find the hidden flag. Sometimes the flag is hidden in the HTML source!',
        category: 'web',
        difficulty: 'easy',
        points: 75,
        flag: 'CTF{inspect_element_is_useful}',
        is_case_sensitive: true,
        is_active: true,
        is_visible: true,
        solve_count: 0,
        author_id: adminId,
        sort_order: 3,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        title: 'Caesar Cipher',
        description: 'ROT13 cipher: PGS{pnrfne_vf_abg_frpher}',
        category: 'crypto',
        difficulty: 'medium',
        points: 150,
        flag: 'CTF{caesar_is_not_secure}',
        is_case_sensitive: true,
        is_active: true,
        is_visible: true,
        solve_count: 0,
        author_id: adminId,
        sort_order: 4,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('challenges', challenges);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('challenges', null, {});
    await queryInterface.bulkDelete('teams', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};