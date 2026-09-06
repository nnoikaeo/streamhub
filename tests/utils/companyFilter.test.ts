/**
 * Tests for app/utils/companyFilter.ts
 *
 * `access.company` is a list of codes, and the Discover filter read it with
 * `in`, which checks array indices — so it returned nothing for every company.
 * The identical bug was fixed server-side in PR #359 and survived here because
 * only admins see the control. These pin both halves: the membership test, and
 * the `ALL` wildcard that `effectiveAccess.ts` treats as every company.
 */

import { describe, it, expect } from 'vitest'
import { matchesCompanyFilter } from '../../app/utils/companyFilter'

/** Only the field the filter reads. */
const withCompanies = (company: string[]) => ({
  access: { public: false, direct: { users: [], groups: [] }, company },
})

describe('matchesCompanyFilter', () => {
  it('matches a company named in the grants', () => {
    expect(matchesCompanyFilter(withCompanies(['STTH']), 'STTH')).toBe(true)
    expect(matchesCompanyFilter(withCompanies(['STTN', 'STTH']), 'STTH')).toBe(true)
  })

  it('does not match a company absent from the grants', () => {
    expect(matchesCompanyFilter(withCompanies(['STTN']), 'STTH')).toBe(false)
  })

  it('is not fooled by an index — the bug that made the filter always empty', () => {
    // `'0' in ['STTH']` is true, and `'STTH' in ['STTH']` is false. A filter
    // written with `in` gets both of these exactly backwards.
    expect(matchesCompanyFilter(withCompanies(['STTH']), '0')).toBe(false)
  })

  it('matches every company for an ALL grant', () => {
    expect(matchesCompanyFilter(withCompanies(['ALL']), 'STTH')).toBe(true)
    expect(matchesCompanyFilter(withCompanies(['ALL']), 'STCM')).toBe(true)
  })

  it('does not match a dashboard with no company grants', () => {
    // Reachable through a direct user or group grant, but not "this company's"
    // — the control answers a question about company access.
    expect(matchesCompanyFilter(withCompanies([]), 'STTH')).toBe(false)
  })

  it('survives a row with no access object at all', () => {
    expect(matchesCompanyFilter({} as Parameters<typeof matchesCompanyFilter>[0], 'STTH')).toBe(false)
  })
})
