import { useMutation } from '@apollo/client';
import { logger } from '@/lib/logger';
import { CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from '../graphql/mutations/project.mutations';
import { GET_PROJECTS, GET_PROJECT } from '../graphql/queries/project.queries';
import { Project, ProjectInput, ProjectUpdateInput } from '../graphql/types/project.types';
import { toast } from 'sonner';

export const useProjectMutations = () => {
  // Create Project Mutation
  const [createProjectMutation, { loading: createLoading }] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
    onCompleted: () => {
      toast.success('Project created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    }
  });

  // Update Project Mutation
  const [updateProjectMutation, { loading: updateLoading }] = useMutation(UPDATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
    onCompleted: () => {
      toast.success('Project updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`);
    }
  });

  // Delete Project Mutation
  const [deleteProjectMutation, { loading: deleteLoading }] = useMutation(DELETE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
    onCompleted: () => {
      toast.success('Project deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    }
  });

  // Wrapper functions with proper typing
  const createProject = async (projectData: ProjectInput) => {
    try {
      const { data } = await createProjectMutation({
        variables: { input: projectData }
      });
      return data.createProject;
    } catch (error) {
      logger.error('Project mutation failed', { operation: 'create', error: String(error) });
      throw error;
    }
  };

  const updateProject = async (id: string, projectData: ProjectUpdateInput) => {
    try {
      const { data } = await updateProjectMutation({
        variables: { 
          id, 
          input: projectData 
        },
        refetchQueries: [
          { query: GET_PROJECTS },
          { query: GET_PROJECT, variables: { id } }
        ]
      });
      return data.updateProject;
    } catch (error) {
      logger.error('Project mutation failed', { operation: 'update', error: String(error) });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { data } = await deleteProjectMutation({
        variables: { id }
      });
      return data.deleteProject;
    } catch (error) {
      logger.error('Project mutation failed', { operation: 'delete', error: String(error) });
      throw error;
    }
  };

  return {
    createProject,
    updateProject,
    deleteProject,
    loading: createLoading || updateLoading || deleteLoading
  };
};
