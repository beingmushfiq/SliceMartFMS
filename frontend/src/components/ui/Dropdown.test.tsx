import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableSelect, MultiSelect } from './Dropdown';

describe('SearchableSelect component', () => {
  const options = [
    { value: 'apple', label: 'Fresh Apples' },
    { value: 'banana', label: 'Sweet Bananas' },
    { value: 'orange', label: 'Citrus Oranges' },
  ];

  it('renders with placeholder and opens options on click', () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Choose fruit"
      />
    );

    const button = screen.getByRole('combobox');
    expect(button).toHaveTextContent('Choose fruit');

    fireEvent.click(button);
    expect(screen.getByText('Fresh Apples')).toBeInTheDocument();
    expect(screen.getByText('Sweet Bananas')).toBeInTheDocument();
  });

  it('filters options based on search input', () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Choose fruit"
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search options...');
    fireEvent.change(searchInput, { target: { value: 'orange' } });

    expect(screen.getByText('Citrus Oranges')).toBeInTheDocument();
    expect(screen.queryByText('Sweet Bananas')).not.toBeInTheDocument();
  });

  it('calls onChange when selecting an option', () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Choose fruit"
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Fresh Apples'));

    expect(handleChange).toHaveBeenCalledWith('apple');
  });
});

describe('MultiSelect component', () => {
  const options = [
    { value: 1, label: 'Tag 1' },
    { value: 2, label: 'Tag 2' },
  ];

  it('renders selected tags', () => {
    const handleChange = vi.fn();
    render(<MultiSelect options={options} values={[1]} onChange={handleChange} />);
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
  });
});
