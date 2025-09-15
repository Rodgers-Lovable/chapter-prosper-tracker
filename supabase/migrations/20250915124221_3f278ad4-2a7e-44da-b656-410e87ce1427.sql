-- Add RLS policy to allow administrators to update any user's profile
CREATE POLICY "Administrators can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'administrator'::user_role);

-- Add RLS policy to allow administrators to delete profiles if needed
CREATE POLICY "Administrators can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'administrator'::user_role);