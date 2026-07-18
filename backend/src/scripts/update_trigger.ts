import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.vapjaqgoikyllyeuilfs:masukkitaatur@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  await client.connect();
  console.log("Connected to DB directly!");

  // 1. Rewrite the handle_new_user trigger to not set full_name and avatar_url
  await client.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, full_name, avatar_url, email)
      VALUES (
        new.id,
        NULL,
        NULL,
        new.email
      );
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  console.log("Trigger updated to NOT include Google profile info.");

  // 2. Erase existing users' full_name and avatar_url so they trigger the onboarding flow
  const res = await client.query(`
    UPDATE public.profiles 
    SET avatar_url = NULL, full_name = NULL 
    WHERE avatar_url LIKE '%googleusercontent.com%'
  `);
  console.log(`Cleared Google avatars for ${res.rowCount} users to force onboarding.`);

  await client.end();
}

main().catch(console.error);
