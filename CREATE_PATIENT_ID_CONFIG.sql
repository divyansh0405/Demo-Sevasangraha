-- Configurable Patient ID System
-- This schema enables healthcare organizations to customize patient identifier formats

-- 1. Create patient_id_config table
CREATE TABLE IF NOT EXISTS patient_id_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT NOT NULL DEFAULT 'default',
    format_name TEXT NOT NULL DEFAULT 'default',

    -- Format Components
    prefix TEXT DEFAULT 'P',                    -- e.g., 'P', 'PAT', 'HOSP'
    include_year BOOLEAN DEFAULT true,          -- Include year (YYYY or YY)
    year_format TEXT DEFAULT 'YYYY',            -- 'YYYY' or 'YY'
    include_month BOOLEAN DEFAULT false,        -- Include month (MM)
    include_date BOOLEAN DEFAULT false,         -- Include date (YYYYMMDD)
    hospital_code TEXT,                         -- e.g., 'H01', 'MUM', 'DLH'
    branch_code TEXT,                           -- e.g., 'BR01', 'N', 'S'
    department_code TEXT,                       -- e.g., 'OPD', 'IPD', 'ER'
    sequence_length INTEGER DEFAULT 6,          -- Number of digits for sequence (e.g., 6 = 000001)
    sequence_start INTEGER DEFAULT 1,           -- Starting number for sequence
    id_type TEXT DEFAULT 'numeric',             -- 'numeric' or 'alphanumeric'
    separator TEXT DEFAULT '',                  -- Separator between components (e.g., '-', '/')

    -- Examples of generated IDs based on format
    example_id TEXT,
    description TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Ensure only one default configuration per hospital
    CONSTRAINT unique_default_per_hospital UNIQUE NULLS NOT DISTINCT (hospital_id, is_default)
);

-- 2. Create patient_id_sequence table to track counters
CREATE TABLE IF NOT EXISTS patient_id_sequence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT NOT NULL DEFAULT 'default',
    year INTEGER,
    month INTEGER,
    sequence_number INTEGER DEFAULT 1,
    last_generated_id TEXT,
    last_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_sequence_per_period UNIQUE (hospital_id, year, month)
);

-- 3. Enable RLS
ALTER TABLE patient_id_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_id_sequence ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Authenticated users can read patient_id_config"
    ON patient_id_config FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patient_id_config"
    ON patient_id_config FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patient_id_config"
    ON patient_id_config FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read patient_id_sequence"
    ON patient_id_sequence FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patient_id_sequence"
    ON patient_id_sequence FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patient_id_sequence"
    ON patient_id_sequence FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_id_config_hospital
    ON patient_id_config(hospital_id, is_active);

CREATE INDEX IF NOT EXISTS idx_patient_id_config_default
    ON patient_id_config(hospital_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_patient_id_sequence_lookup
    ON patient_id_sequence(hospital_id, year, month);

-- 6. Insert default configurations with examples

-- Default Configuration (Simple Sequential)
INSERT INTO patient_id_config (
    format_name, prefix, include_year, year_format, include_month, include_date,
    hospital_code, branch_code, department_code, sequence_length, sequence_start,
    id_type, separator, is_default, example_id, description
) VALUES (
    'Simple Sequential',
    'P',
    false,
    'YYYY',
    false,
    false,
    NULL,
    NULL,
    NULL,
    6,
    1,
    'numeric',
    '',
    true,
    'P000001, P000002, P000003',
    'Simple format with prefix P and 6-digit sequential number'
);

-- Year-Based Configuration
INSERT INTO patient_id_config (
    format_name, prefix, include_year, year_format, include_month, include_date,
    hospital_code, branch_code, department_code, sequence_length, sequence_start,
    id_type, separator, is_default, example_id, description
) VALUES (
    'Year-Based',
    'P',
    true,
    'YYYY',
    false,
    false,
    NULL,
    NULL,
    NULL,
    6,
    1,
    'numeric',
    '',
    false,
    'P2025000001, P2025000002',
    'Format with year and 6-digit sequential number (resets yearly)'
);

-- Hospital + Year Configuration
INSERT INTO patient_id_config (
    format_name, prefix, include_year, year_format, include_month, include_date,
    hospital_code, branch_code, department_code, sequence_length, sequence_start,
    id_type, separator, is_default, example_id, description
) VALUES (
    'Hospital + Year',
    'P',
    true,
    'YY',
    false,
    false,
    'H01',
    NULL,
    NULL,
    5,
    1,
    'numeric',
    '-',
    false,
    'P-H01-25-00001, P-H01-25-00002',
    'Format with hospital code, short year, and 5-digit sequence'
);

-- Full Featured Configuration
INSERT INTO patient_id_config (
    format_name, prefix, include_year, year_format, include_month, include_date,
    hospital_code, branch_code, department_code, sequence_length, sequence_start,
    id_type, separator, is_default, example_id, description
) VALUES (
    'Full Featured',
    'PAT',
    true,
    'YYYY',
    true,
    false,
    'MUM',
    'N',
    NULL,
    4,
    1,
    'numeric',
    '/',
    false,
    'PAT/MUM/N/2025/01/0001',
    'Comprehensive format with hospital, branch, year, month codes'
);

-- Date-Based Configuration
INSERT INTO patient_id_config (
    format_name, prefix, include_year, year_format, include_month, include_date,
    hospital_code, branch_code, department_code, sequence_length, sequence_start,
    id_type, separator, is_default, example_id, description
) VALUES (
    'Date-Based',
    'P',
    false,
    'YYYY',
    false,
    true,
    NULL,
    NULL,
    NULL,
    4,
    1,
    'numeric',
    '',
    false,
    'P202501010001, P202501010002',
    'Format with full date (YYYYMMDD) and 4-digit sequence'
);

-- 7. Updated patient ID generation function
CREATE OR REPLACE FUNCTION generate_patient_id_configurable(
    p_hospital_id TEXT DEFAULT 'default'
)
RETURNS TEXT AS $$
DECLARE
    config RECORD;
    new_id TEXT := '';
    current_year INTEGER;
    current_month INTEGER;
    current_date TEXT;
    sequence_num INTEGER;
    formatted_sequence TEXT;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    -- Get current date components
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    current_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Get active configuration (default first, then any active)
    SELECT * INTO config
    FROM patient_id_config
    WHERE hospital_id = p_hospital_id
        AND is_active = true
    ORDER BY is_default DESC NULLS LAST, created_at DESC
    LIMIT 1;

    -- Fallback to simple format if no config found
    IF config IS NULL THEN
        LOOP
            new_id := 'P' || LPAD(
                (SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 2) AS INTEGER)), 0) + 1
                 FROM patients
                 WHERE patient_id ~ '^P[0-9]+$'),
                6, '0'
            );

            EXIT WHEN NOT EXISTS (SELECT 1 FROM patients WHERE patient_id = new_id);
            attempt := attempt + 1;
            EXIT WHEN attempt >= max_attempts;
        END LOOP;

        RETURN new_id;
    END IF;

    -- Get or create sequence number
    IF config.include_year OR config.include_month THEN
        -- Get sequence for current period
        INSERT INTO patient_id_sequence (
            hospital_id,
            year,
            month,
            sequence_number
        )
        VALUES (
            p_hospital_id,
            CASE WHEN config.include_year OR config.include_date THEN current_year ELSE NULL END,
            CASE WHEN config.include_month THEN current_month ELSE NULL END,
            config.sequence_start
        )
        ON CONFLICT (hospital_id, year, month)
        DO UPDATE SET
            sequence_number = patient_id_sequence.sequence_number + 1,
            last_generated_at = NOW()
        RETURNING sequence_number INTO sequence_num;
    ELSE
        -- Global sequence
        INSERT INTO patient_id_sequence (
            hospital_id,
            year,
            month,
            sequence_number
        )
        VALUES (
            p_hospital_id,
            NULL,
            NULL,
            config.sequence_start
        )
        ON CONFLICT (hospital_id, year, month)
        DO UPDATE SET
            sequence_number = patient_id_sequence.sequence_number + 1,
            last_generated_at = NOW()
        RETURNING sequence_number INTO sequence_num;
    END IF;

    -- Format sequence number
    formatted_sequence := LPAD(sequence_num::TEXT, config.sequence_length, '0');

    -- Build patient ID based on configuration
    new_id := config.prefix;

    -- Add hospital code
    IF config.hospital_code IS NOT NULL AND config.hospital_code != '' THEN
        new_id := new_id || config.separator || config.hospital_code;
    END IF;

    -- Add branch code
    IF config.branch_code IS NOT NULL AND config.branch_code != '' THEN
        new_id := new_id || config.separator || config.branch_code;
    END IF;

    -- Add year
    IF config.include_year THEN
        IF config.year_format = 'YY' THEN
            new_id := new_id || config.separator || TO_CHAR(CURRENT_DATE, 'YY');
        ELSE
            new_id := new_id || config.separator || TO_CHAR(CURRENT_DATE, 'YYYY');
        END IF;
    END IF;

    -- Add month
    IF config.include_month THEN
        new_id := new_id || config.separator || TO_CHAR(CURRENT_DATE, 'MM');
    END IF;

    -- Add date
    IF config.include_date THEN
        new_id := new_id || config.separator || current_date;
    END IF;

    -- Add department code
    IF config.department_code IS NOT NULL AND config.department_code != '' THEN
        new_id := new_id || config.separator || config.department_code;
    END IF;

    -- Add sequence
    IF config.separator != '' AND LENGTH(new_id) > LENGTH(config.prefix) THEN
        new_id := new_id || config.separator || formatted_sequence;
    ELSE
        new_id := new_id || formatted_sequence;
    END IF;

    -- Update last generated ID
    UPDATE patient_id_sequence
    SET last_generated_id = new_id
    WHERE hospital_id = p_hospital_id
        AND year IS NOT DISTINCT FROM (CASE WHEN config.include_year OR config.include_date THEN current_year ELSE NULL END)
        AND month IS NOT DISTINCT FROM (CASE WHEN config.include_month THEN current_month ELSE NULL END);

    RETURN new_id;

EXCEPTION WHEN OTHERS THEN
    -- Fallback to timestamp-based ID on any error
    RETURN 'P' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. Update trigger function to use new configurable generation
CREATE OR REPLACE FUNCTION set_patient_id_configurable()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
        NEW.patient_id := generate_patient_id_configurable('default');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Replace existing trigger
DROP TRIGGER IF EXISTS patient_id_trigger ON patients;
CREATE TRIGGER patient_id_trigger
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_id_configurable();

-- 10. Create function to preview ID format
CREATE OR REPLACE FUNCTION preview_patient_id_format(config_id UUID)
RETURNS TEXT AS $$
DECLARE
    config RECORD;
    preview_id TEXT := '';
    sample_sequence TEXT;
BEGIN
    SELECT * INTO config
    FROM patient_id_config
    WHERE id = config_id;

    IF config IS NULL THEN
        RETURN 'Configuration not found';
    END IF;

    -- Build preview ID
    sample_sequence := LPAD('1', config.sequence_length, '0');
    preview_id := config.prefix;

    IF config.hospital_code IS NOT NULL AND config.hospital_code != '' THEN
        preview_id := preview_id || config.separator || config.hospital_code;
    END IF;

    IF config.branch_code IS NOT NULL AND config.branch_code != '' THEN
        preview_id := preview_id || config.separator || config.branch_code;
    END IF;

    IF config.include_year THEN
        IF config.year_format = 'YY' THEN
            preview_id := preview_id || config.separator || TO_CHAR(CURRENT_DATE, 'YY');
        ELSE
            preview_id := preview_id || config.separator || TO_CHAR(CURRENT_DATE, 'YYYY');
        END IF;
    END IF;

    IF config.include_month THEN
        preview_id := preview_id || config.separator || TO_CHAR(CURRENT_DATE, 'MM');
    END IF;

    IF config.include_date THEN
        preview_id := preview_id || config.separator || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    END IF;

    IF config.department_code IS NOT NULL AND config.department_code != '' THEN
        preview_id := preview_id || config.separator || config.department_code;
    END IF;

    IF config.separator != '' AND LENGTH(preview_id) > LENGTH(config.prefix) THEN
        preview_id := preview_id || config.separator || sample_sequence;
    ELSE
        preview_id := preview_id || sample_sequence;
    END IF;

    RETURN preview_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant permissions
GRANT EXECUTE ON FUNCTION generate_patient_id_configurable(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_patient_id_configurable() TO authenticated;
GRANT EXECUTE ON FUNCTION preview_patient_id_format(UUID) TO authenticated;

-- 12. Create trigger for updated_at
CREATE TRIGGER update_patient_id_config_updated_at
    BEFORE UPDATE ON patient_id_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Configurable Patient ID System created successfully!' as status;

-- Show sample configurations
SELECT
    format_name,
    example_id,
    description,
    is_default
FROM patient_id_config
ORDER BY is_default DESC, format_name;
