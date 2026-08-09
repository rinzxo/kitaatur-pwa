const fs = require('fs');
const content = `

model system_settings {
  key         String   @id
  value       Json
  description String?
  updated_at  DateTime @updatedAt @db.Timestamptz

  @@schema("public")
}

model announcements {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title      String
  content    String
  type       String   @default("info")
  is_active  Boolean  @default(true)
  starts_at  DateTime? @db.Timestamptz
  ends_at    DateTime? @db.Timestamptz
  created_at DateTime @default(now()) @db.Timestamptz

  @@schema("public")
}

model feature_flags {
  key         String   @id
  is_enabled  Boolean  @default(false)
  description String?
  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt @db.Timestamptz

  @@schema("public")
}
`;
fs.appendFileSync('c:/Users/LENOVO1/KITAATUR/backend/prisma/schema.prisma', content);
