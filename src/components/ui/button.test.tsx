import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('should render with default variant', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const button = getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { rerender, getByRole } = render(<Button variant="destructive">Delete</Button>);
    expect(getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(getByRole('button')).toHaveClass('border');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(getByRole('button')).toHaveClass('bg-secondary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(getByRole('button')).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link</Button>);
    expect(getByRole('button')).toHaveClass('text-primary');
  });

  it('should render different sizes', () => {
    const { rerender, getByRole } = render(<Button size="sm">Small</Button>);
    expect(getByRole('button')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(getByRole('button')).toBeInTheDocument();

    rerender(<Button size="icon">Icon</Button>);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    expect(getByRole('button')).toBeDisabled();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    let clicked = false;
    const { getByRole } = render(<Button onClick={() => (clicked = true)}>Click</Button>);
    
    await user.click(getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('should not trigger click when disabled', async () => {
    const user = userEvent.setup();
    let clicked = false;
    const { getByRole } = render(<Button disabled onClick={() => (clicked = true)}>Click</Button>);
    
    await user.click(getByRole('button'));
    expect(clicked).toBe(false);
  });

  it('should render as child component with asChild', () => {
    const { getByRole } = render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(getByRole('link', { name: /link button/i })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { getByRole } = render(<Button className="custom-class">Custom</Button>);
    expect(getByRole('button')).toHaveClass('custom-class');
  });
});
