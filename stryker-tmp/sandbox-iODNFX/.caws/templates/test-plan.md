# 🧪 Test Plan: [Feature Name]

## 📋 Context
**Ticket:** [LINK-123]
**Risk Tier:** [1|2|3]
**Test Environment:** [Development|Staging|Production]

## 🎯 Test Objectives
[What are we validating? What risks are we mitigating?]

### Success Criteria
- **Coverage Target:** [XX]% branch, [XX]% mutation
- **Defect Leakage:** Zero critical defects to production
- **Performance:** Meet all non-functional requirements
- **Compatibility:** Works across all supported platforms

## 🏗️ Test Architecture

### Test Pyramid
```
E2E Tests (Smoke)    [X] tests - [X]% coverage
  Integration Tests   [XX] tests - [XX]% coverage
    Unit Tests       [XXX] tests - [XXX]% coverage
```

### Test Data Strategy
- **Factories:** [Reusable test data generators]
- **Fixtures:** [Static test data files]
- **Seeds:** [Database population scripts]
- **Mocks:** [External service simulations]

## 📋 Test Cases by Type

### 🔍 Unit Tests

#### Business Logic
| Test Case | Input | Expected | Edge Cases |
|-----------|-------|----------|------------|
| [Function Name] | [Input] | [Expected Output] | [Edge cases] |

#### Data Validation
| Test Case | Input | Validation Rules | Error Cases |
|-----------|-------|------------------|-------------|
| [Validation Function] | [Input] | [Rules] | [Error scenarios] |

#### Error Handling
| Test Case | Error Condition | Expected Behavior | Recovery |
|-----------|----------------|-------------------|----------|
| [Error Scenario] | [Condition] | [Behavior] | [Recovery steps] |

### 🔗 Integration Tests

#### API Integration
| Endpoint | Method | Test Data | Assertions | Mock Strategy |
|----------|--------|-----------|------------|---------------|
| `/api/[endpoint]` | POST | [Sample data] | [Response checks] | [What to mock] |

#### Database Integration
| Operation | Test Data | Constraints | Rollback | Assertions |
|-----------|-----------|-------------|----------|------------|
| [CRUD operation] | [Sample data] | [Constraints] | [Cleanup] | [Data integrity] |

#### External Service Integration
| Service | Operation | Test Data | Fallback | Assertions |
|---------|-----------|-----------|----------|------------|
| [Service name] | [Operation] | [Request] | [Fallback behavior] | [Response validation] |

### 🌐 E2E Tests

#### Critical User Journeys
| Journey | Steps | Test Data | Success Criteria | Browser/Device |
|---------|-------|-----------|------------------|---------------|
| [Journey Name] | 1. [Step 1]<br>2. [Step 2] | [User data] | [Observable outcomes] | [Chrome, Firefox] |

#### Error Scenarios
| Error Scenario | Trigger | Expected UI | Recovery Path | Logging |
|----------------|---------|-------------|---------------|---------|
| [Error type] | [How to trigger] | [Error display] | [Recovery steps] | [Log entries] |

## 🔒 Security Testing

### Authentication & Authorization
- [ ] Valid login flows
- [ ] Invalid credential handling
- [ ] Session management
- [ ] Role-based access control
- [ ] Token expiration handling

### Data Protection
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Data encryption at rest/transit

### API Security
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error message sanitization
- [ ] CORS configuration
- [ ] API versioning

## ♿ Accessibility Testing

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Keyboard shortcuts work
- [ ] Focus indicators visible
- [ ] Skip links present
- [ ] Modal focus management

### Screen Reader Compatibility
- [ ] Semantic HTML used
- [ ] ARIA labels present
- [ ] Alt text on images
- [ ] Form labels associated
- [ ] Error messages announced

### Visual Accessibility
- [ ] Color contrast sufficient
- [ ] Text size adjustable
- [ ] Focus indicators visible
- [ ] Animations can be disabled
- [ ] High contrast mode support

## ⚡ Performance Testing

### Load Testing
- **Concurrent Users:** [X] users
- **Duration:** [X] minutes
- **Ramp-up:** [X] users/minute
- **Success Criteria:** [Response time < Xms, Error rate < X%]

### Stress Testing
- **Break Point:** [X] concurrent users
- **Recovery Time:** [X] seconds
- **Resource Limits:** [CPU < X%, Memory < X%]

### API Performance
| Endpoint | Method | Expected P95 | Load Test | Assertions |
|----------|--------|--------------|-----------|------------|
| `/api/[endpoint]` | GET | < 500ms | 100 req/sec | [Response time, error rate] |

## 🧪 Contract Testing

### Provider Contracts (Our APIs)
| Contract | Format | Tool | Test Count | Coverage |
|----------|--------|------|------------|----------|
| [API Name] | OpenAPI | MSW | [X] tests | [XX]% |

### Consumer Contracts (External APIs)
| Service | Contract | Tool | Test Count | Coverage |
|---------|----------|------|------------|----------|
| [Service Name] | Pact | Pact-JS | [X] tests | [XX]% |

## 🤖 Property-Based Testing

### Invariants to Test
| Property | Generator | Test Count | Edge Cases |
|----------|-----------|------------|------------|
| [Business Rule] | [Data generator] | [X] iterations | [Boundary values] |

### State Machine Testing
| State | Transitions | Invariants | Edge Cases |
|-------|-------------|------------|------------|
| [State Name] | [Valid transitions] | [State invariants] | [Invalid transitions] |

## 🔄 Test Automation

### CI/CD Integration
- **Trigger:** [Push/PR to main]
- **Parallel Execution:** [Unit || Integration || E2E]
- **Failure Handling:** [Quarantine flaky tests]
- **Reporting:** [JUnit XML, coverage reports]

### Test Environments
- **Development:** [Local test execution]
- **Staging:** [Full integration test suite]
- **Production:** [Smoke tests, synthetic monitoring]

## 📊 Test Execution & Reporting

### Test Execution Matrix
| Test Type | Environment | Frequency | Owner | Timeout |
|-----------|-------------|-----------|-------|---------|
| Unit | Local + CI | Every commit | Developer | 5min |
| Integration | Staging | PR + Daily | QA | 15min |
| E2E | Staging | PR + Deploy | QA | 30min |
| Performance | Production | Weekly | SRE | 60min |

### Coverage Requirements by Tier
| Tier | Branch Coverage | Mutation Score | Contract Coverage |
|------|----------------|----------------|-------------------|
| 1 | ≥ 90% | ≥ 70% | 100% |
| 2 | ≥ 80% | ≥ 50% | 100% |
| 3 | ≥ 70% | ≥ 30% | N/A |

### Quality Gates
- [ ] All unit tests pass
- [ ] Coverage requirements met
- [ ] Mutation score requirements met
- [ ] No critical security findings
- [ ] Performance budgets met
- [ ] Accessibility requirements met
- [ ] Contract tests pass
- [ ] E2E smoke tests pass

## 🚨 Risk Mitigation

### High-Risk Areas
| Risk | Mitigation | Test Coverage | Contingency |
|------|------------|---------------|-------------|
| [High-risk component] | [Testing strategy] | [Coverage plan] | [Backup plan] |

### Flaky Test Management
- **Detection:** Variance analysis (>0.5% failure rate)
- **Quarantine:** Auto-label and skip in CI
- **Investigation:** Owner assignment within 24h
- **Fix Timeline:** 7 days or revert

## 📈 Success Metrics

### Test Health Metrics
- **Test Execution Time:** < [X] minutes
- **Flake Rate:** < [X]%
- **Coverage Trend:** Improving weekly
- **Defect Detection Rate:** > [X]% of defects caught

### Quality Metrics
- **Trust Score:** ≥ 80/100
- **Production Defects:** < [X] per month
- **MTTR:** < [X] hours
- **Customer Satisfaction:** ≥ [X]%

---

*Generated by CAWS framework - Risk Tier: [X] - Test Count: [XXX]*
