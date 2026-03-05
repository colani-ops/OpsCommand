using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OpsCommand.Api.Config;
using OpsCommand.Api.Domain.Entities;
using OpsCommand.Api.Infrastructure.Data;
using OpsCommand.Api.Infrastructure.Seed;
using OpsCommand.Api.Repositories.Equipments;
using OpsCommand.Api.Repositories.Missions;
using OpsCommand.Api.Repositories.Squads;
using OpsCommand.Api.Repositories.Users;
using OpsCommand.Api.Services.Auth;
using OpsCommand.Api.Services.Equipments;
using OpsCommand.Api.Services.Missions;
using OpsCommand.Api.Services.Squads;
using OpsCommand.Api.Services.Users;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

//Bind JwtSettings
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
var key = Encoding.UTF8.GetBytes(jwtSettings!.Key);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddScoped<ITokenService, TokenService>();



builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<ISquadRepository, SquadRepository>();
builder.Services.AddScoped<ISquadService, SquadService>();

builder.Services.AddScoped<IMissionRepository, MissionRepository>();
builder.Services.AddScoped<IMissionService, MissionService>();

builder.Services.AddScoped<IEquipmentRepository, EquipmentRepository>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();


//CORS
/*builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});*/

var corsOrigins = builder.Configuration
    .GetSection("Cors:Origins")
    .Get<string[]>() ?? Array.Empty<string>();

    builder.Services.AddCors(options =>
        {   
        options.AddPolicy("FrontendPolicy", policy =>
        {
            policy
                .WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

if (corsOrigins.Length == 0)
{
    throw new Exception("CORS origins not configured. Set Cors:Origins in appsettings or env vars.");
}



var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

//User Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (!app.Environment.IsDevelopment())
    {
        await db.Database.MigrateAsync();
    }

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    await RoleSeeder.SeedRoles(roleManager);

    var email = builder.Configuration["Seed:SuperAdminEmail"] ?? "superadmin@debug.com";
    var password = builder.Configuration["Seed:SuperAdminPassword"];

    var user = await userManager.FindByEmailAsync(email);

    if (string.IsNullOrWhiteSpace(password))
        throw new Exception("Seed:SuperAdminPassword missing. Set user-secrets or env var.");

    if (user == null)
    {
        user = new ApplicationUser
        {
            UserName = "SuperAdmin",
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    if (!await userManager.IsInRoleAsync(user, "SuperAdmin"))
        await userManager.AddToRoleAsync(user, "SuperAdmin");
}


app.MapGet("/", () => "OpsCommand API running");

app.Run();

