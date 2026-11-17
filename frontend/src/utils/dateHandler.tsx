import { format } from "date-fns";

// Format date safely with fallback
export const formatDateSafe = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'recently';
    }
  };