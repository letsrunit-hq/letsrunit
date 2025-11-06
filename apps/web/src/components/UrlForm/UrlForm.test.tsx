import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UrlForm } from './UrlForm';

describe('UrlForm', () => {
  it('renders input and button and calls onSubmit', () => {
    const onSubmit = vi.fn();
    render(<UrlForm placeholder="https://www.example.com" buttonLabel="Run it." onSubmitUrl={onSubmit} />);
    const input = screen.getByLabelText('website-input') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /run it\./i });
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'https://test.com' } });
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith('https://test.com');
  });
});
