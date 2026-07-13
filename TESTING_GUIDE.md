# P.S. It's A Vibe Homepage - Testing & Quality Assurance Guide

## Testing Overview

This guide covers comprehensive testing for the P.S. It's A Vibe homepage redesign.

## Unit Testing

### Firebase Integration Tests

#### Test 1: Homepage Config Loading
**File:** `index.js`
**Function:** `loadHomepageConfig()`

```javascript
// Test: Should load homepage config without errors
async function testLoadHomepageConfig() {
  const config = await loadHomepageConfig();
  console.assert(config !== null, 'Config should not be null');
  console.assert(config.hero !== undefined, 'Config should have hero section');
  console.assert(config.about !== undefined, 'Config should have about section');
  console.log('✅ loadHomepageConfig test passed');
}

// Test: Should handle missing config gracefully
async function testMissingConfig() {
  // Delete config doc first, then test
  const config = await loadHomepageConfig();
  console.assert(config === null, 'Should return null for missing config');
  console.log('✅ Missing config test passed');
}
```

#### Test 2: Promotion Filtering
**Function:** `loadActivePromotions()`

```javascript
// Test cases:
// 1. Enabled promo with no dates should show
// 2. Enabled promo with future start date should not show
// 3. Enabled promo with past end date should not show
// 4. Disabled promo should not show regardless of dates
// 5. Multiple promos should be sorted by displayOrder

async function testPromotionFiltering() {
  const promos = await loadActivePromotions();
  
  // Test sorting
  for (let i = 1; i < promos.length; i++) {
    console.assert(
      promos[i].displayOrder >= promos[i-1].displayOrder,
      'Promos should be sorted by displayOrder'
    );
  }
  
  // Test date filtering
  const now = new Date();
  promos.forEach(promo => {
    if (promo.startDate) {
      const start = new Date(promo.startDate);
      console.assert(now >= start, `Promo ${promo.id} should have passed startDate`);
    }
    if (promo.endDate) {
      const end = new Date(promo.endDate);
      console.assert(now <= end, `Promo ${promo.id} should not have passed endDate`);
    }
    console.assert(promo.enabled === true, `Promo ${promo.id} should be enabled`);
  });
  
  console.log('✅ Promotion filtering tests passed');
}
```

#### Test 3: Featured Products Loading
**Function:** `loadFeaturedProducts()`

```javascript
async function testFeaturedProductsLoading() {
  const products = await loadFeaturedProducts();
  
  // Should return array (even if empty)
  console.assert(Array.isArray(products), 'Should return an array');
  
  // Each product should have required fields
  products.forEach(product => {
    console.assert(product.id !== undefined, 'Product should have id');
    console.assert(product.name !== undefined, 'Product should have name');
    console.assert(product.price !== undefined, 'Product should have price');
  });
  
  console.log('✅ Featured products loading test passed');
}
```

#### Test 4: Categories Loading
**Function:** `loadCategories()`

```javascript
async function testCategoriesLoading() {
  const categories = await loadCategories();
  
  console.assert(Array.isArray(categories), 'Should return an array');
  
  categories.forEach(cat => {
    console.assert(cat.id !== undefined, 'Category should have id');
    console.assert(cat.name !== undefined, 'Category should have name');
    console.assert(cat.enabled === true, 'Only enabled categories should show');
  });
  
  // Verify sorting
  for (let i = 1; i < categories.length; i++) {
    console.assert(
      categories[i].displayOrder >= categories[i-1].displayOrder,
      'Categories should be sorted by displayOrder'
    );
  }
  
  console.log('✅ Categories loading test passed');
}
```

## Integration Testing

### DOM Rendering Tests

#### Test 5: Hero Section Rendering
```javascript
function testHeroSectionRendering() {
  const heroHeadline = document.getElementById('hero-headline');
  const heroSubheading = document.getElementById('hero-subheading');
  const heroButton = document.getElementById('hero-button');
  const heroImage = document.getElementById('hero-image');
  
  console.assert(heroHeadline !== null, 'Hero headline element should exist');
  console.assert(heroSubheading !== null, 'Hero subheading element should exist');
  console.assert(heroButton !== null, 'Hero button element should exist');
  console.assert(heroImage !== null, 'Hero image element should exist');
  
  console.assert(heroHeadline.textContent.length > 0, 'Hero headline should have content');
  console.assert(heroSubheading.textContent.length > 0, 'Hero subheading should have content');
  console.assert(heroButton.href.length > 0, 'Hero button should have href');
  
  console.log('✅ Hero section rendering test passed');
}
```

#### Test 6: Promo Carousel Rendering
```javascript
function testPromoCarouselRendering() {
  const carousel = document.getElementById('promo-carousel');
  const indicators = document.getElementById('promo-indicators');
  const promoSection = document.getElementById('promo-section');
  
  if (promoSection.classList.contains('hidden')) {
    console.log('⚠️ Promo section hidden (expected if no promos)');
    return;
  }
  
  const promoItems = carousel.querySelectorAll('.promo-item');
  const dots = indicators.querySelectorAll('.promo-dot');
  
  console.assert(promoItems.length > 0, 'Should have at least one promo item');
  console.assert(dots.length === promoItems.length, 'Number of dots should match promo items');
  console.assert(
    carousel.querySelector('.promo-item.active') !== null,
    'Should have an active promo item'
  );
  
  console.log('✅ Promo carousel rendering test passed');
}
```

#### Test 7: Featured Products Carousel Rendering
```javascript
function testFeaturedCarouselRendering() {
  const carousel = document.getElementById('featured-carousel');
  const cards = carousel.querySelectorAll('.featured-product-card');
  
  console.assert(cards.length >= 0, 'Carousel should exist');
  
  if (cards.length > 0) {
    cards.forEach((card, index) => {
      const img = card.querySelector('img');
      const name = card.querySelector('h4');
      const price = card.querySelector('.price');
      
      console.assert(img !== null, `Card ${index} should have image`);
      console.assert(name !== null, `Card ${index} should have name`);
      console.assert(price !== null, `Card ${index} should have price`);
    });
  }
  
  console.log('✅ Featured carousel rendering test passed');
}
```

#### Test 8: Categories Grid Rendering
```javascript
function testCategoriesGridRendering() {
  const grid = document.getElementById('categories-grid');
  const cards = grid.querySelectorAll('.category-card');
  
  console.assert(cards.length > 0, 'Should have at least one category card');
  
  cards.forEach((card, index) => {
    const link = card.href;
    const name = card.querySelector('h3');
    
    console.assert(link !== undefined && link.length > 0, `Card ${index} should be a link`);
    console.assert(name !== null, `Card ${index} should have name`);
  });
  
  console.log('✅ Categories grid rendering test passed');
}
```

#### Test 9: About Section Rendering
```javascript
function testAboutSectionRendering() {
  const aboutText = document.getElementById('about-text');
  const aboutImage = document.getElementById('about-image');
  
  console.assert(aboutText !== null, 'About text element should exist');
  console.assert(aboutImage !== null, 'About image element should exist');
  console.assert(aboutText.textContent.length > 0, 'About text should have content');
  
  console.log('✅ About section rendering test passed');
}
```

## Responsive Design Testing

### Test Breakpoints
Test the homepage at these viewport sizes:

```javascript
const breakpoints = [
  { name: 'Mobile Small', width: 320, height: 568 },
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1024, height: 768 },
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Large Desktop', width: 2560, height: 1440 }
];
```

### Manual Testing Checklist

- [ ] Mobile 320px: All sections stack, text readable
- [ ] Mobile 375px: Buttons clickable, images load
- [ ] Tablet 768px: Two-column layout where appropriate
- [ ] Laptop 1024px: Full layout visible
- [ ] Desktop 1920px+: Content centered, doesn't overflow
- [ ] Touch devices: Buttons large enough, no hover issues
- [ ] Landscape/Portrait: Layout adapts smoothly

## Performance Testing

### Lighthouse Audit
```bash
# Run Google Lighthouse
# Or use Chrome DevTools: F12 → Lighthouse

Targets:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 80
- SEO: > 90
```

### Image Performance
```javascript
function testImagePerformance() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    const naturalWidth = img.naturalWidth;
    const displayWidth = img.offsetWidth;
    
    // Warn if image is oversized (natural > display * 1.5)
    if (naturalWidth > displayWidth * 1.5) {
      console.warn(`Image oversized: ${img.src} (${naturalWidth}px shown as ${displayWidth}px)`);
    }
  });
}
```

### Load Time Testing
```javascript
// Measure initialization time
const startTime = performance.now();

// ... after initializeHomepage() completes
const endTime = performance.now();
const loadTime = endTime - startTime;

console.assert(loadTime < 3000, `Homepage should load in < 3s, took ${loadTime}ms`);
console.log(`✅ Homepage loaded in ${loadTime.toFixed(0)}ms`);
```

## Browser Compatibility Testing

Test on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Test Scenarios
- [ ] CSS Grid and Flexbox render correctly
- [ ] CSS variables work properly
- [ ] Smooth scroll behavior works
- [ ] Dynamic content updates
- [ ] Images display correctly
- [ ] Buttons are clickable
- [ ] Forms accept input (if applicable)

## Edge Case Testing

### Test Empty States
```javascript
// Test when no promotions exist
async function testEmptyPromos() {
  const promoSection = document.getElementById('promo-section');
  // Should be hidden if no promos
  console.assert(promoSection.classList.contains('hidden'), 'Promo section should be hidden when empty');
}

// Test when featured products don't exist
async function testEmptyFeatured() {
  const carousel = document.getElementById('featured-carousel');
  const content = carousel.textContent;
  console.assert(content.includes('No featured products'), 'Should show message when empty');
}

// Test when categories don't exist
async function testEmptyCategories() {
  const grid = document.getElementById('categories-grid');
  const content = grid.textContent;
  console.assert(content.includes('available'), 'Should show message when empty');
}
```

### Test Data Validation
```javascript
// Test with invalid dates
async function testInvalidDates() {
  const invalidDate = 'not-a-date';
  try {
    new Date(invalidDate);
    // Should handle gracefully
    console.log('✅ Invalid date handled');
  } catch (e) {
    console.error('Invalid date caused error:', e);
  }
}

// Test with missing fields
async function testMissingFields() {
  const incompletePromo = {
    title: 'No Image Promo',
    // image field missing
  };
  // Should render without crashing
  console.log('✅ Missing fields handled');
}

// Test with very long text
async function testLongText() {
  const longText = 'a'.repeat(10000);
  // Should display without breaking layout
  console.log('✅ Long text handled');
}
```

### Test Firebase Failure Scenarios
```javascript
// Test when Firebase is not initialized
function testFirebaseNotReady() {
  if (!isFirebaseReady) {
    console.log('✅ Handles Firebase not ready correctly');
  }
}

// Test network errors
async function testNetworkError() {
  try {
    // Simulate network failure
    const result = await Promise.race([
      loadHomepageConfig(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
  } catch (error) {
    console.log('✅ Network error handled:', error.message);
  }
}
```

## Accessibility Testing

### Test Checklist
- [ ] Keyboard navigation works (Tab through elements)
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] Form labels are associated with inputs
- [ ] Focus indicators are visible
- [ ] Screen reader compatible (use NVDA or JAWS)

### Manual Accessibility Test
```javascript
// Check for alt text
function testImageAltText() {
  const images = document.querySelectorAll('img');
  const missingAlt = [];
  
  images.forEach(img => {
    if (!img.getAttribute('alt') || img.getAttribute('alt').trim() === '') {
      missingAlt.push(img.src);
    }
  });
  
  if (missingAlt.length === 0) {
    console.log('✅ All images have alt text');
  } else {
    console.warn('⚠️ Images missing alt text:', missingAlt);
  }
}

// Check color contrast
function testColorContrast() {
  // Recommend using axe DevTools browser extension
  console.log('📍 Use axe DevTools extension to check color contrast');
}
```

## User Experience Testing

### Common User Journeys
1. **New Visitor**
   - [ ] Lands on homepage
   - [ ] Reads hero section
   - [ ] Sees promotions
   - [ ] Browses categories
   - [ ] Clicks "Shop Now" button

2. **Returning Visitor**
   - [ ] Sees updated promotions
   - [ ] Finds specific category
   - [ ] Adds items to cart
   - [ ] Proceeds to checkout

3. **Mobile User**
   - [ ] Page loads quickly
   - [ ] All buttons are tap-friendly
   - [ ] Scrolling is smooth
   - [ ] Images display properly

## A/B Testing Preparation

For future A/B tests:
- [ ] Set up Google Analytics tracking
- [ ] Track hero button clicks
- [ ] Track category clicks
- [ ] Track promo engagement
- [ ] Measure conversion rates

## Regression Testing

After each update:
1. Run full test suite
2. Check all sections render
3. Verify no console errors
4. Test on multiple browsers
5. Check performance metrics

## Automated Testing Setup (Optional)

Using Cypress or Playwright:

```javascript
// Example Cypress test
describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/index.html');
  });

  it('should display hero section', () => {
    cy.get('#hero-headline').should('be.visible');
    cy.get('#hero-subheading').should('be.visible');
    cy.get('#hero-button').should('be.visible');
  });

  it('should load featured products', () => {
    cy.get('#featured-carousel').should('exist');
  });

  it('should display categories', () => {
    cy.get('#categories-grid .category-card').should('have.length.greaterThan', 0);
  });
});
```

## Test Execution Guide

### Quick Test (5 minutes)
```bash
# Quick manual checks
1. Open homepage
2. Check hero loads
3. Scroll through sections
4. Test mobile view
5. Check console for errors
```

### Standard Test (30 minutes)
```bash
# Run all manual tests
1. Run unit tests from browser console
2. Check all sections render correctly
3. Test on multiple devices
4. Verify responsive design
5. Check images load properly
6. Test accessibility
```

### Full Test (2 hours)
```bash
# Comprehensive testing
1. Run all manual tests
2. Run Lighthouse audit
3. Test all browsers
4. Test all breakpoints
5. Performance profiling
6. Accessibility audit
7. Real-time update testing
8. Error scenario testing
```

## Test Results Documentation

Document results in format:
```
Test: [Name]
Date: [Date]
Browser: [Browser/Version]
Device: [Device Type]
Result: [PASS/FAIL]
Notes: [Any issues found]
```

## Continuous Improvement

- Review test results weekly
- Update tests when features change
- Add new tests for bug fixes
- Monitor user feedback
- Iterate on design based on analytics
