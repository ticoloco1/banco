
-- Fix notification INSERT policy to be more restrictive
-- Notifications should be inserted by authenticated users or service role
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
