USE [SenseRegister]
GO

/****** Object:  Table [dbo].[RegistrationInfoes]    Script Date: 10/01/2015 15:57:45 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[RegistrationInfoes](
  [RegistrationInfoID] [int] IDENTITY(1,1) NOT NULL,
  [Surname] [nvarchar](75) NOT NULL,
  [Name] [nvarchar](75) NOT NULL,
  [Middlename] [nvarchar](75) NULL,
  [Email] [nvarchar](150) NOT NULL,
  [Phone] [nvarchar](50) NOT NULL,
  [Position] [nvarchar](100) NOT NULL,
  [Company] [nvarchar](150) NOT NULL,
  [IndustryID] [nvarchar](max) NULL,
  [SelectedApplication] [nvarchar](max) NOT NULL,
  [Registered] [datetime] NOT NULL,
  [Granted] [datetime] NULL,
  [Accessed] [datetime] NULL,
  [Deleted] [datetime] NULL,
  [State] [tinyint] NOT NULL,
  [Login] [nvarchar](max) NULL,
--  [Password] [nvarchar](max) NULL,
  [Lang] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED
(
  [RegistrationInfoID] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
