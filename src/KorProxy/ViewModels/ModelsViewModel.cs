using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.DependencyInjection;

namespace KorProxy.ViewModels;

public partial class ModelsViewModel : ViewModelBase
{
    private readonly IManagementApiClient _apiClient;

    [ObservableProperty]
    private ObservableCollection<ModelGroupViewModel> _modelGroups = [];

    [ObservableProperty]
    private int _totalModels;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string? _errorMessage;

    [ActivatorUtilitiesConstructor]
    public ModelsViewModel(IManagementApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public ModelsViewModel()
    {
        _apiClient = null!;
        
        ModelGroups =
        [
            new ModelGroupViewModel
            {
                ProviderName = "Claude (Anthropic)",
                Models = [
                    new ModelItemViewModel { Id = "claude-sonnet-4-5", DisplayName = "Claude Sonnet 4.5" },
                    new ModelItemViewModel { Id = "claude-opus-4-5", DisplayName = "Claude Opus 4.5" }
                ]
            },
            new ModelGroupViewModel
            {
                ProviderName = "Codex (OpenAI)",
                Models = [
                    new ModelItemViewModel { Id = "gpt-5.2-codex", DisplayName = "GPT-5.2 Codex" }
                ]
            }
        ];
        TotalModels = 3;
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        await RefreshModelsAsync();
    }

    [RelayCommand]
    private async Task RefreshModelsAsync()
    {
        if (_apiClient == null) return;
        
        IsLoading = true;
        ErrorMessage = null;
        
        try
        {
            var models = await _apiClient.GetModelsAsync();
            
            var groups = models
                .GroupBy(m => m.Provider)
                .OrderBy(g => g.Key)
                .Select(g => new ModelGroupViewModel
                {
                    ProviderName = g.Key,
                    Models = new ObservableCollection<ModelItemViewModel>(
                        g.OrderBy(m => m.Id).Select(m => new ModelItemViewModel
                        {
                            Id = m.Id,
                            DisplayName = m.DisplayName ?? m.Id,
                            OwnedBy = m.OwnedBy,
                            Type = m.Type
                        }))
                })
                .ToList();

            ModelGroups.Clear();
            foreach (var group in groups)
            {
                ModelGroups.Add(group);
            }
            
            TotalModels = models.Count;
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load models: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }
}

public partial class ModelGroupViewModel : ObservableObject
{
    public required string ProviderName { get; init; }
    public ObservableCollection<ModelItemViewModel> Models { get; init; } = [];
    public int ModelCount => Models.Count;
}

public partial class ModelItemViewModel : ObservableObject
{
    public required string Id { get; init; }
    public string? DisplayName { get; init; }
    public string? OwnedBy { get; init; }
    public string? Type { get; init; }
}
