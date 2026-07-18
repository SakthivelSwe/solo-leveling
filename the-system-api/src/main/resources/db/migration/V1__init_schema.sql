
    create table achievements (
        id bigserial not null,
        player_id bigint not null,
        unlocked_at timestamp(6),
        achievement_key varchar(100) not null,
        title varchar(200) not null,
        description varchar(500),
        primary key (id)
    );

    create table ai_memory (
        week_start date not null,
        created_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        memory_type varchar(20) not null,
        quest_key varchar(50),
        memory_value varchar(500) not null,
        primary key (id)
    );

    create table body_logs (
        cold_shower boolean,
        exercise_done boolean,
        log_date date not null,
        morning_sun_min integer,
        no_porn boolean,
        no_soda boolean,
        slept_before_1130 boolean,
        discipline_pillars integer,
        zinc_meal boolean,
        id bigserial not null,
        player_id bigint not null,
        primary key (id),
        unique (player_id, log_date)
    );

    create table body_metrics (
        body_fat_pct float(53),
        log_date date not null,
        weight_kg float(53),
        id bigserial not null,
        player_id bigint not null,
        note varchar(300),
        primary key (id),
        unique (player_id, log_date)
    );

    create table boss_battles (
        score integer,
        xp_earned integer,
        completed_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        started_at timestamp(6),
        difficulty varchar(20),
        answers TEXT,
        evaluations TEXT,
        questions TEXT,
        topic varchar(255) not null,
        primary key (id)
    );

    create table budget_entries (
        food_spend integer,
        misc integer not null,
        online_orders integer,
        pg_rent integer,
        salary integer not null,
        saved integer not null,
        sip_amount integer,
        transport integer not null,
        entry_month varchar(7) not null,
        id bigserial not null,
        player_id bigint not null,
        notes varchar(1000),
        primary key (id),
        unique (player_id, entry_month)
    );

    create table course_progress (
        completed_topics integer,
        last_updated date,
        total_topics integer,
        id bigserial not null,
        player_id bigint not null,
        course_name varchar(255) not null,
        primary key (id)
    );

    create table daily_missions (
        mission_date date not null,
        generated_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        focus_stat varchar(10),
        focus_area varchar(30),
        side_quest_keys varchar(300),
        main_quest_keys varchar(500),
        primary key (id),
        unique (player_id, mission_date)
    );

    create table deep_work_sessions (
        coding_minutes integer not null,
        focus_score integer not null,
        focus_sessions integer not null,
        focus_xp_earned integer not null,
        interruptions integer not null,
        mobile_pickups integer not null,
        session_date date not null,
        created_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        notes varchar(500),
        primary key (id)
    );

    create table dev_mastery_progress (
        xp_earned integer,
        completed_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        path_slug varchar(255) not null,
        topic_id varchar(255) not null,
        topic_title varchar(255) not null,
        primary key (id)
    );

    create table diet_entries (
        calories integer,
        consumed_date date not null,
        protein_grams integer,
        quantity_grams integer,
        id bigserial not null,
        player_id bigint not null,
        vitamins varchar(500),
        category varchar(255),
        food_name varchar(255) not null,
        primary key (id)
    );

    create table dopamine_logs (
        cold_shower boolean not null,
        dopamine_score integer not null,
        exercise_done boolean not null,
        focus_pct integer not null,
        gaming_min integer not null,
        junk_food_items integer not null,
        log_date date not null,
        porn_viewed boolean not null,
        reels_min integer not null,
        social_media_min integer not null,
        created_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        primary key (id),
        unique (player_id, log_date)
    );

    create table dungeons (
        cleared boolean not null,
        damage_dealt integer,
        reward_xp integer,
        total_hp integer,
        week_start date not null,
        cleared_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        boss_name varchar(60),
        name varchar(80),
        primary key (id),
        unique (player_id, week_start)
    );

    create table english_logs (
        log_date date not null,
        mock_interview boolean,
        new_words integer,
        self_rating integer,
        speaking_min integer,
        id bigserial not null,
        player_id bigint not null,
        notes varchar(1000),
        resource_used varchar(255),
        topic_practiced varchar(255),
        primary key (id),
        unique (player_id, log_date)
    );

    create table exercise_logs (
        duration_min integer,
        exercise_date date not null,
        plank_seconds integer,
        pushups_reps integer,
        pushups_sets integer,
        squats_reps integer,
        squats_sets integer,
        id bigserial not null,
        player_id bigint not null,
        notes varchar(500),
        exercise_type varchar(255),
        primary key (id)
    );

    create table habit_completions (
        completed_at date not null,
        quality integer not null,
        two_minute boolean not null,
        xp_gained integer not null,
        habit_id bigint not null,
        id bigserial not null,
        player_id bigint not null,
        note varchar(500),
        primary key (id),
        constraint uq_habit_player_date unique (player_id, habit_id, completed_at)
    );

    create table habits (
        active_days integer not null,
        archived boolean not null,
        difficulty integer not null,
        is_keystone boolean not null,
        cue_time varchar(5),
        created_at timestamp(6) not null,
        id bigserial not null,
        player_id bigint not null,
        stack_after_habit_id bigint,
        identity_tag varchar(60),
        cue_location varchar(100),
        name varchar(120) not null,
        two_minute_version varchar(200),
        craving varchar(300),
        cue varchar(300),
        reward varchar(300),
        routine varchar(300),
        primary key (id)
    );

    create table health_logs (
        breakfast_eaten boolean,
        dinner_eaten boolean,
        energy_afternoon integer,
        energy_evening integer,
        energy_morning integer,
        food_quality integer,
        log_date date not null,
        lunch_eaten boolean,
        sleep_bedtime time(6),
        sleep_quality integer,
        sleep_wake_time time(6),
        water_glasses integer,
        id bigserial not null,
        player_id bigint not null,
        breakfast_what varchar(255),
        dinner_what varchar(255),
        lunch_what varchar(255),
        primary key (id),
        unique (player_id, log_date)
    );

    create table interview_rounds (
        date_scheduled date,
        round_number integer,
        application_id bigint not null,
        id bigserial not null,
        result varchar(20),
        round_type varchar(20),
        feedback varchar(2000),
        notes varchar(2000),
        primary key (id)
    );

    create table inventory_items (
        bonus_value integer not null,
        equipped boolean not null,
        id bigserial not null,
        player_id bigint not null,
        unlocked_at timestamp(6),
        item_emoji varchar(10),
        bonus_type varchar(20),
        item_type varchar(20),
        item_key varchar(50) not null,
        unlocked_by_milestone varchar(80),
        item_name varchar(100) not null,
        primary key (id)
    );

    create table job_applications (
        applied_date date,
        ctc_offered integer,
        id bigserial not null,
        player_id bigint not null,
        updated_at timestamp(6),
        status varchar(20),
        job_url varchar(500),
        notes varchar(2000),
        company varchar(255) not null,
        role varchar(255) not null,
        primary key (id)
    );

    create table learning_logs (
        ai_analyzed boolean,
        coded_along boolean,
        confidence_score integer,
        duration_minutes integer not null,
        log_date date not null,
        note_taken boolean,
        recall_done boolean,
        review_count integer,
        review_due_date date,
        xp_earned integer,
        created_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        activity_type varchar(30),
        source varchar(30) not null,
        devmastery_topic_id varchar(36),
        platform_name varchar(100),
        subject varchar(100) not null,
        video_title varchar(300),
        recall_key_point_results varchar(500),
        source_url varchar(500),
        notes varchar(1000),
        ai_recall_questions varchar(2000),
        ai_summary varchar(2000),
        ai_key_points varchar(3000),
        topic varchar(255) not null,
        primary key (id)
    );

    create table leetcode_log (
        solved_date date,
        solved_without_ai boolean,
        time_taken_min integer,
        id bigserial not null,
        player_id bigint not null,
        difficulty varchar(10),
        language varchar(50),
        topic varchar(100),
        problem_url varchar(500),
        notes varchar(1000),
        problem_name varchar(255) not null,
        primary key (id)
    );

    create table mind_logs (
        anxiety_level integer,
        log_date date not null,
        mood_evening integer,
        mood_morning integer,
        office_pressure integer,
        sleep_debt_days integer,
        id bigserial not null,
        player_id bigint not null,
        counter_evidence varchar(500),
        gratitude varchar(500),
        today_win varchar(500),
        dark_thought varchar(2000),
        evening_reflection varchar(2000),
        morning_intention varchar(2000),
        primary key (id),
        unique (player_id, log_date)
    );

    create table notifications (
        is_read boolean,
        created_at timestamp(6),
        id bigserial not null,
        player_id bigint not null,
        type varchar(40),
        message varchar(500) not null,
        title varchar(255) not null,
        primary key (id)
    );

    create table player_skills (
        skill_level integer default 1,
        skill_pct integer,
        skill_rank varchar(2) default 'E',
        skill_xp integer default 0,
        id bigserial not null,
        player_id bigint not null,
        updated_at timestamp(6),
        skill_name varchar(100) not null,
        primary key (id)
    );

    create table player_stats (
        agility integer not null,
        hor integer default 10,
        intelligence integer not null,
        perception integer not null,
        strength integer not null,
        vitality integer not null,
        id bigserial not null,
        player_id bigint not null,
        updated_at timestamp(6),
        primary key (id)
    );

    create table players (
        consecutive_days_below_threshold integer,
        current_xp integer,
        hp integer,
        in_penalty_zone boolean,
        level integer not null,
        max_hp integer,
        total_xp integer,
        created_at timestamp(6),
        id bigserial not null,
        penalty_zone_end_time timestamp(6),
        rank_level varchar(10),
        equipped_title varchar(40),
        username varchar(50) not null unique,
        display_name varchar(100),
        email varchar(100) not null unique,
        password varchar(255) not null,
        primary key (id)
    );

    create table quest_completions (
        completed_at date not null,
        xp_gained integer not null,
        id bigserial not null,
        player_id bigint not null,
        quest_id bigint not null,
        primary key (id),
        constraint uq_player_quest_date unique (player_id, quest_id, completed_at)
    );

    create table quest_generation_logs (
        id bigserial not null,
        player_id bigint not null,
        generation_date date not null,
        generated_at timestamp(6) not null,
        primary key (id),
        unique (player_id, generation_date)
    );

    create table quest_skill_boosts (
        boost_value integer,
        quest_id bigint not null,
        skill_name varchar(100) not null,
        primary key (quest_id, skill_name)
    );

    create table quest_stat_boosts (
        boost_value integer,
        quest_id bigint not null,
        stat_name varchar(50) not null,
        primary key (quest_id, stat_name)
    );

    create table quests (
        boss_damage integer default 10,
        is_active boolean,
        is_critical boolean default false,
        is_custom boolean default false,
        is_recovery_quest boolean default false,
        priority integer default 3,
        xp_reward integer not null,
        id bigserial not null,
        player_id bigint,
        category varchar(20) not null check (category in ('DAILY','SKILL','DISCIPLINE','SIDE','MILESTONE','WEEKLY','MONTHLY')),
        time_type varchar(20) default 'DAILY',
        quest_key varchar(50) not null unique,
        label varchar(255) not null,
        primary key (id)
    );

    create table relationship_logs (
        call_duration_min integer,
        call_quality integer,
        family_contact boolean,
        friend_message boolean,
        gf_called boolean,
        log_date date not null,
        id bigserial not null,
        player_id bigint not null,
        notes varchar(500),
        friend_name varchar(255),
        primary key (id),
        unique (player_id, log_date)
    );

    create table savings_goals (
        achieved boolean not null,
        current_amount integer,
        deadline date,
        target_amount integer not null,
        id bigserial not null,
        player_id bigint not null,
        goal_name varchar(255) not null,
        primary key (id)
    );

    create table self_doubt_evidence (
        entry_date date not null,
        id bigserial not null,
        player_id bigint not null,
        category varchar(20),
        evidence varchar(1000) not null,
        primary key (id)
    );

    create table shadows (
        active_since date not null,
        power_level integer not null,
        shadow_level integer not null,
        streak_at_activation integer not null,
        habit_id bigint not null,
        id bigserial not null,
        last_updated timestamp(6),
        player_id bigint not null,
        shadow_type varchar(20),
        shadow_name varchar(100) not null,
        primary key (id),
        unique (player_id, habit_id)
    );

    create table skill_tree_nodes (
        progress_pct integer not null,
        unlocked boolean not null,
        xp_invested integer not null,
        id bigserial not null,
        player_id bigint not null,
        node_key varchar(255) not null,
        node_name varchar(255) not null,
        parent_skill_name varchar(255) not null,
        prerequisite_node_key varchar(255),
        primary key (id)
    );

    create table vocabulary_log (
        learned_date date not null,
        id bigserial not null,
        player_id bigint not null,
        word varchar(100) not null,
        example varchar(1000),
        meaning varchar(1000) not null,
        primary key (id)
    );

    create table workout_entries (
        reps integer not null,
        sets integer not null,
        weight_kg float(53),
        workout_date date not null,
        id bigserial not null,
        player_id bigint not null,
        exercise_name varchar(120) not null,
        notes varchar(300),
        primary key (id)
    );

    create index idx_hc_player_date 
       on habit_completions (player_id, completed_at);

    create index idx_hc_habit_date 
       on habit_completions (habit_id, completed_at);

    create index idx_habit_player 
       on habits (player_id);

    create index idx_habit_active 
       on habits (player_id, archived);

    create index idx_workout_player 
       on workout_entries (player_id);

    alter table if exists quest_skill_boosts 
       add constraint FKifjx1cev33413hvb9k4mpltl7 
       foreign key (quest_id) 
       references quests;

    alter table if exists quest_stat_boosts 
       add constraint FKq96gwscjh1rgva2701mcvgfh8 
       foreign key (quest_id) 
       references quests;
