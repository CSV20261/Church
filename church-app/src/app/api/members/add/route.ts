import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      first_name,
      last_name,
      full_name,
      gift,
      category,
      apostleship_id,
      overseership_id,
      eldership_id,
      priestship_id,
    } = body;
    
    // Note: We don't use 'gender' directly - it's derived from title in the database

    // Validate required fields
    if (!first_name || !category) {
      return NextResponse.json(
        { error: 'First name and category are required' },
        { status: 400 }
      );
    }

    // Log the attempt for debugging
    console.log('🔵 [API] Attempting to insert member with user ID:', user.id);
    console.log('🔵 [API] Member data:', {
      title, first_name, last_name, gift, category,
      apostleship_id, overseership_id, eldership_id, priestship_id
    });

    // Derive gender from title (must be 'Brother' or 'Sister' per DB constraint)
    let gender = 'Brother'; // default
    if (title === 'Sr' || title === 'Mrs' || title === 'Ms') {
      gender = 'Sister';
    }

    // Insert new member into database
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        title,
        first_name,
        last_name,
        full_name: full_name || `${first_name} ${last_name}`.trim(),
        gender, // Required field - derived from title
        gift,
        category,
        apostleship_id,
        overseership_id,
        eldership_id,
        priestship_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [API] Error inserting member:', insertError);
      console.error('❌ [API] Error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to add member', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      member: newMember 
    });

  } catch (error) {
    console.error('Error in add member API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
