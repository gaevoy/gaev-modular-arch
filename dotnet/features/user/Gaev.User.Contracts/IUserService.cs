namespace Gaev.User.Contracts;

public interface IUserService
{
    Task<UserDto?> GetUser(Guid id);
    Task<IEnumerable<UserDto>> ListUsers();
    Task<UserDto> CreateUser(CreateUserRequest request);
}
