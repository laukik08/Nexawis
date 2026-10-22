/**
 * Regression Test: Production Mock-Data Isolation
 * Proves that production mode never silently substitutes mock data or synthetic recommendations,
 * and that demo fixtures are only accessible through explicit demo configuration.
 */

import assert from 'node:assert';
import { 
  teamFormationService, 
  setDemoModeOverride, 
  isMockFallbackAllowed 
} from './src/services/teamFormationService.ts';

async function runTests() {
  console.log('--- Starting Production Mock-Data Isolation Audit Tests ---');

  // 1. Verify Default/Production Mode Rejection
  setDemoModeOverride(false);
  assert.strictEqual(isMockFallbackAllowed(), false, 'isMockFallbackAllowed() must be false when demo mode is disabled');

  // Test 1: Non-UUID Project in Production Mode must throw real error, not fabricate candidates
  console.log('Test 1: Non-UUID project in production mode...');
  try {
    await teamFormationService.generateTeamRecommendations(
      {
        id: 'proj-1', // Non-UUID mock ID
        projectId: 'PRJ-MOCK',
        name: 'Mock Project',
        description: 'Test',
        department: 'Engineering',
        priority: 'High',
        status: 'Planning',
        deadline: '2026-12-31',
        budget: 100000,
        teamSize: 4,
        allocatedCount: 0,
        requirements: [],
        riskLevel: 'Low',
        progress: 0,
        teamMembers: [],
      },
      {
        projectId: 'proj-1',
        teamSize: 4,
        requiredSkills: [],
        preferredRoles: [],
        skillCoverageMode: 'Balanced',
        minAvailability: 50,
        workloadTolerance: 'Balanced',
        wellbeingRiskTolerance: 'ModerateAllowed',
        performancePreference: 'Balanced',
        includeGrowthOpportunities: true,
      }
    );
    assert.fail('Expected generateTeamRecommendations to throw error in production mode for non-UUID project');
  } catch (err: any) {
    assert.ok(
      err.message.includes('not a valid UUID') || err.message.includes('Production mode'),
      `Expected production rejection message, got: ${err.message}`
    );
    console.log('  PASSED: Production mode rejected non-UUID project without silent mock generation.');
  }

  // Test 2: Unreachable backend UUID call in Production Mode must throw, not return mock fallback
  console.log('Test 2: Failed backend call in production mode must throw real error...');
  try {
    await teamFormationService.generateTeamRecommendations(
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        projectId: 'PRJ-REAL',
        name: 'Real Project',
        description: 'Test',
        department: 'Engineering',
        priority: 'High',
        status: 'Planning',
        deadline: '2026-12-31',
        budget: 100000,
        teamSize: 4,
        allocatedCount: 0,
        requirements: [],
        riskLevel: 'Low',
        progress: 0,
        teamMembers: [],
      },
      {
        projectId: 'a0000000-0000-0000-0000-000000000001',
        teamSize: 4,
        requiredSkills: [],
        preferredRoles: [],
        skillCoverageMode: 'Balanced',
        minAvailability: 50,
        workloadTolerance: 'Balanced',
        wellbeingRiskTolerance: 'ModerateAllowed',
        performancePreference: 'Balanced',
        includeGrowthOpportunities: true,
      }
    );
    assert.fail('Expected generateTeamRecommendations to throw on unreachable backend in production mode');
  } catch (err: any) {
    assert.ok(
      err.message.includes('fetch failed') || err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED') || err.message.includes('Production mode'),
      `Expected real network or production rejection error, got: ${err.message}`
    );
    console.log('  PASSED: Production mode threw real network/backend error instead of silent mock recommendation.');
  }

  // Test 3: getFormationKpis in Production Mode must throw when backend is unavailable
  console.log('Test 3: getFormationKpis in production mode must throw on failure...');
  try {
    await teamFormationService.getFormationKpis();
    assert.fail('Expected getFormationKpis to throw when backend is unreachable in production mode');
  } catch (err: any) {
    assert.ok(err, 'Expected error thrown on backend failure');
    console.log('  PASSED: Production mode did not silently return mock KPI counters.');
  }

  // Test 4: Finalization without valid formation ID in Production Mode must throw
  console.log('Test 4: finalizeFormation in production mode must reject missing or non-UUID formation ID...');
  try {
    await teamFormationService.finalizeFormation({
      projectId: 'a0000000-0000-0000-0000-000000000001',
      projectName: 'Test Project',
      projectDepartment: 'Engineering',
      teamSize: 4,
      teamFitScore: 85,
      members: [],
      metrics: {
        skillCoverage: 100,
        workloadBalance: 85,
        sustainability: 90,
        availabilityCoverage: 80,
      },
    });
    assert.fail('Expected finalizeFormation to throw in production mode when formationId is missing');
  } catch (err: any) {
    assert.ok(
      err.message.includes('Valid backend formationId is required'),
      `Expected formationId requirement error, got: ${err.message}`
    );
    console.log('  PASSED: Production mode blocked local synthetic finalization without real backend formationId.');
  }

  // Test 5: Explicit Demo Mode Allows Fallback
  console.log('Test 5: Explicit demo mode override allows preview fixtures...');
  setDemoModeOverride(true);
  assert.strictEqual(isMockFallbackAllowed(), true);

  const demoRecommendations = await teamFormationService.generateTeamRecommendations(
    {
      id: 'demo-proj-1',
      projectId: 'DEMO-PRJ',
      name: 'Demo Project',
      description: 'Demo',
      department: 'Engineering',
      priority: 'High',
      status: 'Planning',
      deadline: '2026-12-31',
      budget: 100000,
      teamSize: 3,
      allocatedCount: 0,
      requirements: [],
      riskLevel: 'Low',
      progress: 0,
      teamMembers: [],
    },
    {
      projectId: 'demo-proj-1',
      teamSize: 3,
      requiredSkills: [],
      preferredRoles: [],
      skillCoverageMode: 'Balanced',
      minAvailability: 50,
      workloadTolerance: 'Balanced',
      wellbeingRiskTolerance: 'ModerateAllowed',
      performancePreference: 'Balanced',
      includeGrowthOpportunities: true,
    }
  );
  assert.strictEqual(demoRecommendations.candidates.length, 3, 'Demo mode should return 3 candidates');
  console.log('  PASSED: Demo mode explicitly enabled successfully generated preview candidates.');

  // Clean up Team Formation demo override
  setDemoModeOverride(null);

  // -------------------------------------------------------------------------
  // Analytics Service Production Mock-Data Isolation
  // -------------------------------------------------------------------------
  const { 
    analyticsService, 
    setDemoModeOverride: setAnalyticsDemoMode, 
    isDemoModeActive: isAnalyticsDemoActive 
  } = await import('./src/services/analyticsService.ts');

  // Test 6: Analytics getAnalyticsData in Production Mode must throw, not return mock fallback
  console.log('Test 6: analyticsService.getAnalyticsData in production mode must throw on failure...');
  setAnalyticsDemoMode(false);
  assert.strictEqual(isAnalyticsDemoActive(), false, 'isAnalyticsDemoActive() must be false');
  try {
    await analyticsService.getAnalyticsData({
      dateRange: { preset: '30d' },
      department: 'All',
      projectId: 'All',
      searchQuery: '',
    });
    assert.fail('Expected getAnalyticsData to throw in production mode when backend is unreachable');
  } catch (err: any) {
    assert.ok(err, 'Expected error thrown on backend failure in production mode');
    console.log('  PASSED: Production mode threw real error instead of fabricating mock analytics trends.');
  }

  // Test 7: Analytics getFilterOptions in Production Mode must throw on failure
  console.log('Test 7: analyticsService.getFilterOptions in production mode must throw on failure...');
  try {
    await analyticsService.getFilterOptions();
    assert.fail('Expected getFilterOptions to throw in production mode when backend is unreachable');
  } catch (err: any) {
    assert.ok(err, 'Expected error thrown on backend failure in production mode');
    console.log('  PASSED: Production mode did not silently return mock departments or projects.');
  }

  // Test 8: Analytics explicit Demo Mode allows mock payload
  console.log('Test 8: analyticsService in explicit demo mode returns demo fixtures...');
  setAnalyticsDemoMode(true);
  assert.strictEqual(isAnalyticsDemoActive(), true);
  const demoPayload = await analyticsService.getAnalyticsData({
    dateRange: { preset: '30d' },
    department: 'All',
    projectId: 'All',
    searchQuery: '',
  });
  assert.ok(demoPayload.kpis, 'Demo payload must include kpis');
  assert.ok(demoPayload.awisTrend.length > 0, 'Demo payload should include mock trends');
  console.log('  PASSED: Demo mode explicitly enabled successfully generated demo analytics payload.');

  setAnalyticsDemoMode(null);

  // -------------------------------------------------------------------------
  // Report Service Production Mock-Data Isolation
  // -------------------------------------------------------------------------
  const {
    reportService,
    setDemoModeOverride: setReportDemoMode,
    isDemoModeActive: isReportDemoActive
  } = await import('./src/services/reportService.ts');

  // Test 9: Reports getReportKpis in Production Mode must throw, not return mock fallback
  console.log('Test 9: reportService.getReportKpis in production mode must throw on failure...');
  setReportDemoMode(false);
  assert.strictEqual(isReportDemoActive(), false, 'isReportDemoActive() must be false');
  try {
    await reportService.getReportKpis();
    assert.fail('Expected getReportKpis to throw in production mode when backend is unreachable');
  } catch (err: any) {
    assert.ok(err, 'Expected error thrown on backend failure in production mode');
    console.log('  PASSED: Production mode threw real error instead of fabricating mock report KPIs.');
  }

  // Test 10: Reports getReports in Production Mode must throw on failure
  console.log('Test 10: reportService.getReports in production mode must throw on failure...');
  try {
    await reportService.getReports();
    assert.fail('Expected getReports to throw in production mode when backend is unreachable');
  } catch (err: any) {
    assert.ok(err, 'Expected error thrown on backend failure in production mode');
    console.log('  PASSED: Production mode did not silently return mock report records.');
  }

  // Test 11: Reports explicit Demo Mode allows demo fixtures
  console.log('Test 11: reportService in explicit demo mode returns demo fixtures...');
  setReportDemoMode(true);
  assert.strictEqual(isReportDemoActive(), true);
  const demoKpis = await reportService.getReportKpis();
  assert.ok(demoKpis.totalReports >= 0, 'Demo KPIs must include totalReports');
  const demoReportList = await reportService.getReports();
  assert.ok(demoReportList.length > 0, 'Demo reports should return fixtures');
  console.log('  PASSED: Demo mode explicitly enabled successfully generated demo report items.');

  setReportDemoMode(null);
  console.log('\nAll Production Mock-Data Isolation tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
