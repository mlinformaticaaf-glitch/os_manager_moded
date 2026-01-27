import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle text input', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText } = render(<Input placeholder="Type here" />);
    
    const input = getByPlaceholderText('Type here');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByPlaceholderText } = render(<Input disabled placeholder="Disabled" />);
    expect(getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('should handle different types', () => {
    const { rerender, getByPlaceholderText } = render(<Input type="email" placeholder="Email" />);
    expect(getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="Password" />);
    expect(getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" placeholder="Number" />);
    expect(getByPlaceholderText('Number')).toHaveAttribute('type', 'number');
  });

  it('should apply custom className', () => {
    const { getByPlaceholderText } = render(<Input className="custom-input" placeholder="Custom" />);
    expect(getByPlaceholderText('Custom')).toHaveClass('custom-input');
  });

  it('should have correct base styles', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Styled" />);
    const input = getByPlaceholderText('Styled');
    expect(input).toHaveClass('flex', 'w-full', 'rounded-md', 'border');
  });

  it('should handle value prop (controlled component)', () => {
    const { getByPlaceholderText } = render(<Input value="Controlled" onChange={() => {}} placeholder="Ctrl" />);
    expect(getByPlaceholderText('Ctrl')).toHaveValue('Controlled');
  });

  it('should call onChange when input changes', async () => {
    const user = userEvent.setup();
    let value = '';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      value = e.target.value;
    };
    
    const { getByPlaceholderText } = render(<Input onChange={handleChange} placeholder="Change me" />);
    await user.type(getByPlaceholderText('Change me'), 'New Value');
    
    expect(value).toBe('New Value');
  });
});
