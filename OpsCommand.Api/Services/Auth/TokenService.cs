using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpsCommand.Api.Services.Auth
{
    using global::OpsCommand.Api.Config;
    using global::OpsCommand.Api.Domain.Entities;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.Extensions.Options;
    using Microsoft.IdentityModel.Tokens;
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Text;

    namespace OpsCommand.Api.Services.Auth
    {
        public class TokenService : ITokenService
        {
            private readonly UserManager<ApplicationUser> _userManager;
            private readonly JwtSettings _jwtSettings;

            public TokenService(
                UserManager<ApplicationUser> userManager,
                IOptions<JwtSettings> jwtOptions)
            {
                _userManager = userManager;
                _jwtSettings = jwtOptions.Value;
            }

            public async Task<string> GenerateTokenAsync(ApplicationUser user)
            {
                var authClaims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

                // Roles
                var roles = await _userManager.GetRolesAsync(user);
                foreach (var role in roles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, role));
                }

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));

                var token = new JwtSecurityToken(
                    issuer: _jwtSettings.Issuer,
                    audience: _jwtSettings.Audience,
                    expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
        }
    }

}
