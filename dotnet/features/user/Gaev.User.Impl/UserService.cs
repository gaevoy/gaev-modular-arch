using Gaev.User.Contracts;

namespace Gaev.User.Impl;

internal sealed class UserService : IUserService
{
    private readonly Dictionary<Guid, UserDto> _store = new();

    public Task<UserDto?> GetUser(Guid id) =>
        Task.FromResult(_store.TryGetValue(id, out var u) ? u : null);

    public Task<IEnumerable<UserDto>> ListUsers() =>
        Task.FromResult<IEnumerable<UserDto>>(_store.Values);

    public Task<UserDto> CreateUser(CreateUserRequest request)
    {
        var user = new UserDto(Guid.NewGuid(), request.Name, request.Email);
        _store[user.Id] = user;
        return Task.FromResult(user);
    }
}
