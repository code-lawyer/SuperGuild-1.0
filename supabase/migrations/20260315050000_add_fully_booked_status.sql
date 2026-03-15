-- Add FULLY_BOOKED to collab_status enum
-- Required by multi-slot collaborations: when all slots are taken, parent status → FULLY_BOOKED
ALTER TYPE collab_status ADD VALUE IF NOT EXISTS 'FULLY_BOOKED';
