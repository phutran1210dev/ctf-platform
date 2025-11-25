'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fix Teams table
    await queryInterface.renameColumn('teams', 'captainId', 'captain_id');
    await queryInterface.renameColumn('teams', 'isPublic', 'is_public');
    await queryInterface.renameColumn('teams', 'maxMembers', 'max_members');
    await queryInterface.renameColumn('teams', 'inviteCode', 'invite_code');
    await queryInterface.renameColumn('teams', 'solveCount', 'solve_count');
    await queryInterface.renameColumn('teams', 'lastSolveTime', 'last_solve_time');
    await queryInterface.renameColumn('teams', 'isActive', 'is_active');
    await queryInterface.renameColumn('teams', 'createdAt', 'created_at');
    await queryInterface.renameColumn('teams', 'updatedAt', 'updated_at');

    // Fix Challenges table
    await queryInterface.renameColumn('challenges', 'flagRegex', 'flag_regex');
    await queryInterface.renameColumn('challenges', 'isCaseSensitive', 'is_case_sensitive');
    await queryInterface.renameColumn('challenges', 'dockerImage', 'docker_image');
    await queryInterface.renameColumn('challenges', 'dockerPort', 'docker_port');
    await queryInterface.renameColumn('challenges', 'dockerEnv', 'docker_env');
    await queryInterface.renameColumn('challenges', 'isActive', 'is_active');
    await queryInterface.renameColumn('challenges', 'isVisible', 'is_visible');
    await queryInterface.renameColumn('challenges', 'solveCount', 'solve_count');
    await queryInterface.renameColumn('challenges', 'maxAttempts', 'max_attempts');
    await queryInterface.renameColumn('challenges', 'authorId', 'author_id');
    await queryInterface.renameColumn('challenges', 'sortOrder', 'sort_order');
    await queryInterface.renameColumn('challenges', 'unlockAfter', 'unlock_after');
    await queryInterface.renameColumn('challenges', 'timeLimit', 'time_limit');
    await queryInterface.renameColumn('challenges', 'startTime', 'start_time');
    await queryInterface.renameColumn('challenges', 'endTime', 'end_time');
    await queryInterface.renameColumn('challenges', 'createdAt', 'created_at');
    await queryInterface.renameColumn('challenges', 'updatedAt', 'updated_at');

    // Fix Submissions table
    await queryInterface.renameColumn('submissions', 'userId', 'user_id');
    await queryInterface.renameColumn('submissions', 'teamId', 'team_id');
    await queryInterface.renameColumn('submissions', 'challengeId', 'challenge_id');
    await queryInterface.renameColumn('submissions', 'submittedFlag', 'submitted_flag');
    await queryInterface.renameColumn('submissions', 'isCorrect', 'is_correct');
    await queryInterface.renameColumn('submissions', 'ipAddress', 'ip_address');
    await queryInterface.renameColumn('submissions', 'userAgent', 'user_agent');
    await queryInterface.renameColumn('submissions', 'submissionTime', 'submission_time');
    await queryInterface.renameColumn('submissions', 'createdAt', 'created_at');
    await queryInterface.renameColumn('submissions', 'updatedAt', 'updated_at');

    // Fix Solves table
    await queryInterface.renameColumn('solves', 'userId', 'user_id');
    await queryInterface.renameColumn('solves', 'teamId', 'team_id');
    await queryInterface.renameColumn('solves', 'challengeId', 'challenge_id');
    await queryInterface.renameColumn('solves', 'submissionId', 'submission_id');
    await queryInterface.renameColumn('solves', 'solveTime', 'solve_time');
    await queryInterface.renameColumn('solves', 'isFirstBlood', 'is_first_blood');
    await queryInterface.renameColumn('solves', 'createdAt', 'created_at');
    await queryInterface.renameColumn('solves', 'updatedAt', 'updated_at');
  },

  async down(queryInterface, Sequelize) {
    // Reverse the changes
    // Teams table
    await queryInterface.renameColumn('teams', 'captain_id', 'captainId');
    await queryInterface.renameColumn('teams', 'is_public', 'isPublic');
    await queryInterface.renameColumn('teams', 'max_members', 'maxMembers');
    await queryInterface.renameColumn('teams', 'invite_code', 'inviteCode');
    await queryInterface.renameColumn('teams', 'solve_count', 'solveCount');
    await queryInterface.renameColumn('teams', 'last_solve_time', 'lastSolveTime');
    await queryInterface.renameColumn('teams', 'is_active', 'isActive');
    await queryInterface.renameColumn('teams', 'created_at', 'createdAt');
    await queryInterface.renameColumn('teams', 'updated_at', 'updatedAt');

    // And so on for other tables...
  }
};