// frontend/src/__tests__/components/ProjectForm.test.tsx
// Guards the zod <-> @hookform/resolvers integration: an invalid submit must
// surface field messages (not throw), and a valid one must reach onSubmit.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectForm from '@/components/projects/ProjectForm';

test('shows schema messages and does not submit when fields are invalid', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<ProjectForm onSubmit={onSubmit} isSubmitting={false} />);

  await userEvent.type(screen.getByLabelText(/project title/i), 'ab');
  await userEvent.type(screen.getByLabelText(/image url/i), 'not a url');
  await userEvent.type(screen.getByLabelText(/github url/i), 'nope');
  await userEvent.click(screen.getByRole('button', { name: /create project/i }));

  expect(await screen.findByText('Title must be at least 3 characters')).toBeInTheDocument();
  expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
  expect(screen.getByText('Please enter a valid URL for the image')).toBeInTheDocument();
  expect(screen.getByText('Please enter a valid GitHub URL')).toBeInTheDocument();
  expect(screen.getByText('Add at least one technology')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('submits parsed values when fields are valid', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<ProjectForm onSubmit={onSubmit} isSubmitting={false} />);

  await userEvent.type(screen.getByLabelText(/project title/i), 'Portfolio');
  await userEvent.type(screen.getByLabelText(/description/i), 'A full-stack portfolio app');
  await userEvent.type(screen.getByLabelText(/image url/i), 'https://example.com/image.jpg');
  await userEvent.type(screen.getByPlaceholderText(/e\.g\. React/i), 'React');
  await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
  await userEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Portfolio',
      description: 'A full-stack portfolio app',
      imageUrl: 'https://example.com/image.jpg',
      technologies: ['React'],
    })
  );
});
