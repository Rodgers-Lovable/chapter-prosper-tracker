-- Add INSERT policy for audit_logs to allow admins to log actions
CREATE POLICY "Administrators can insert audit logs" 
ON audit_logs 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'administrator'::user_role);

-- Add INSERT policy for admins to create chapters
CREATE POLICY "Administrators can create chapters" 
ON chapters 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'administrator'::user_role);

-- Add UPDATE policy for admins to update chapters
CREATE POLICY "Administrators can update chapters" 
ON chapters 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'administrator'::user_role);

-- Add DELETE policy for admins to delete chapters
CREATE POLICY "Administrators can delete chapters" 
ON chapters 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'administrator'::user_role);