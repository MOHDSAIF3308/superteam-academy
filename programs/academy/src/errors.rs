use anchor_lang::prelude::*;

#[error_code]
pub enum AcademyError {
    #[msg("Course is not active")]
    CourseNotActive = 6000,

    #[msg("Prerequisite course not completed")]
    PrerequisiteNotMet = 6001,

    #[msg("Lesson index out of bounds")]
    InvalidLessonIndex = 6002,

    #[msg("Lesson already completed")]
    LessonAlreadyCompleted = 6003,

    #[msg("Daily XP limit exceeded")]
    DailyXPLimitExceeded = 6004,

    #[msg("Not all lessons completed")]
    CourseNotFullyCompleted = 6005,

    #[msg("Course already finalized")]
    CourseAlreadyFinalized = 6006,

    #[msg("Unauthorized signer")]
    UnauthorizedSigner = 6007,

    #[msg("Invalid account state")]
    InvalidAccountState = 6008,

    #[msg("Achievement already claimed")]
    AchievementAlreadyClaimed = 6009,

    #[msg("Invalid achievement")]
    InvalidAchievement = 6010,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow = 6011,

    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow = 6012,

    #[msg("Insufficient XP balance")]
    InsufficientXPBalance = 6013,

    #[msg("Invalid token account")]
    InvalidTokenAccount = 6014,

    #[msg("Cannot unlink all accounts")]
    CannotUnlinkAll = 6015,

    #[msg("Enrollment not found or not completed")]
    EnrollmentNotCompleted = 6016,

    #[msg("Season not initialized")]
    SeasonNotInitialized = 6017,

    #[msg("Backend signer mismatch")]
    BackendSignerMismatch = 6018,

    #[msg("Token ATA mismatch")]
    TokenATAMismatch = 6019,

    #[msg("Minimum completions not met for creator reward")]
    MinCompletionsNotMet = 6020,
}
