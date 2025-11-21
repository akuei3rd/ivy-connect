-- Create connections table for friend requests
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connections
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their own connections"
  ON public.connections FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create chat_messages table for in-call messaging
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat messages
CREATE POLICY "Users can view messages from their matches"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = chat_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their matches"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = chat_messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime for connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- Add trigger for connections updated_at
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();