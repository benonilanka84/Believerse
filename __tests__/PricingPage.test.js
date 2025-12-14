import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PricingPage from '@/app/pricing/page';
import '@testing-library/jest-dom';

// Mock the global fetch (since we rely on an external API for Geo-IP)
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ country_code: 'US' }), // Default mock to US
  })
);

describe('Pricing Page Logic', () => {
  
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders Global Pricing ($) by default for US users', async () => {
    render(<PricingPage />);
    
    // Wait for the currency to stabilize after "fetch"
    await waitFor(() => {
      expect(screen.getByText(/Global/i)).toBeInTheDocument();
    });

    // Check if Gold Plan shows Dollar Symbol
    const goldPrice = screen.getByText(/\$4.99/i); 
    expect(goldPrice).toBeInTheDocument();
  });

  test('switches to INR (₹) when India is selected manually', async () => {
    render(<PricingPage />);

    // Find the currency dropdown
    const currencySelect = screen.getByRole('combobox');
    
    // Simulate user selecting "India"
    fireEvent.change(currencySelect, { target: { value: 'INR' } });

    // Check if price updated to ₹99
    const goldPriceInRupees = screen.getByText(/₹99/i);
    expect(goldPriceInRupees).toBeInTheDocument();
  });

  test('Monthly vs Yearly toggle updates price correctly', async () => {
    render(<PricingPage />);

    // 1. Initial State (Monthly)
    // Assuming default US ($4.99/mo)
    expect(screen.getByText(/\$4.99/i)).toBeInTheDocument();

    // 2. Click "Yearly" Toggle
    const yearlyButton = screen.getByText(/Yearly/i);
    fireEvent.click(yearlyButton);

    // 3. Check Result (Should be $49.99/yr)
    const goldYearlyPrice = screen.getByText(/\$49.99/i);
    expect(goldYearlyPrice).toBeInTheDocument();
  });
});