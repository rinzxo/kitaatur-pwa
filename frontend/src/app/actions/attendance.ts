"use server";

import jwt from "jsonwebtoken";
import { createClient } from "@/lib/supabase/server";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key_for_kitaatur_attendance";

export async function generateAttendanceToken(orgId: string) {
  try {
    // Check if the user is authorized to generate the token (head or secretary)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user role in organization
    const { data: orgMember, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("profile_id", user.id)
      .single();

    if (memberError || !orgMember) {
      return { success: false, error: "Not a member of this organization" };
    }

    if (orgMember.role !== "head" && orgMember.role !== "sekretaris") {
      return { success: false, error: "Only Head or Secretary can generate attendance tokens" };
    }

    // Generate token valid for today
    const payload = {
      orgId,
      date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    };

    // Token expires in 1 day or end of day? Let's give it 12 hours
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    return { success: true, token };
  } catch (error: any) {
    console.error("Error generating token:", error);
    return { success: false, error: error.message || "Failed to generate token" };
  }
}

export async function processAttendanceScan(token: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized. Please login first." };
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return { success: false, error: "Invalid or expired QR Code" };
    }

    const { orgId, date } = decoded;
    const todayDate = new Date().toISOString().split("T")[0];

    if (date !== todayDate) {
      return { success: false, error: "QR Code is for a different day" };
    }

    // Check if user is member of the organization
    const { data: orgMember, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("profile_id", user.id)
      .single();

    if (memberError || !orgMember) {
      return { success: false, error: "You are not a member of this organization" };
    }

    // Check if user already scanned today
    // We do this by checking if there is already an attendance record for this user, this org, on this day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingAttendance, error: checkError } = await supabase
      .from("attendance")
      .select("id")
      .eq("organization_id", orgId)
      .eq("profile_id", user.id)
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .single();

    if (existingAttendance) {
      return { success: false, error: "You have already marked your attendance today" };
    }

    // Insert attendance record
    const { error: insertError } = await supabase
      .from("attendance")
      .insert({
        organization_id: orgId,
        profile_id: user.id,
        status: "present",
        check_in_time: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return { success: false, error: "Failed to record attendance in database" };
    }

    return { success: true, message: "Attendance successfully recorded" };

  } catch (error: any) {
    console.error("Error processing scan:", error);
    return { success: false, error: error.message || "Failed to process scan" };
  }
}
